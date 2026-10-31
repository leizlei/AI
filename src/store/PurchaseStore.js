import { makeAutoObservable, reaction, runInAction, toJS } from 'mobx';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services';
import { ACCOUNT_LINK_ENABLED } from '../services/iap/accountLink';
import { iapApi } from '../services/iap/iapApi';
import { bindingSource } from '../services/iap/bindingSource';
import { NativeStore } from '../services/iap/NativeStore';
import { palEvents } from '../services/palshub/palEvents';
import { UNKNOWN_CONTENT_VERSION } from '../services/iap/iapWire';
import { changedCreatorFields } from '../services/iap/creatorContent';
import { PLUS_PRODUCT_IDS, isPlusProduct } from '../services/plus/catalog';
import { palStore as defaultPalStore } from './PalStore';
export const LEDGER_KEY = 'purchase-ledger';
export const PLUS_KEY = 'plus-entitlement';
export const RETRY_DELAYS_MS = [2000, 4000, 8000, 16000, 32000];
export const RETRY_STEADY_MS = 60000;
export const STALE_PENDING_MS = 72 * 60 * 60 * 1000;
const PLUS_CHAIN = 'plus';
const isPlusDoc = (raw) => {
    if (raw === null) {
        return false;
    }
    try {
        const doc = JSON.parse(raw);
        return doc?.version === 1 && typeof doc.productId === 'string';
    }
    catch {
        return false;
    }
};
const SETTLED = new Set([
    'granted',
    'active',
    'unfulfillable',
    'held_invalid',
    'removed',
]);
export const isSettled = (status) => status !== undefined && SETTLED.has(status);
const isLive = (rec) => rec !== undefined && rec.status !== 'removed';
const reopensTombstone = (rec, tx) => rec.status === 'removed' &&
    !(tx.transactionId && rec.transactionIds.includes(tx.transactionId));
const RETRYABLE_RESULTS = new Set([
    'failed',
    'unavailable',
]);
const platform = () => Platform.OS === 'ios' ? 'ios' : 'android';
const isPlusTransaction = (tx) => isPlusProduct(tx.productId);
const isPalTransaction = (tx) => !isPlusTransaction(tx);
const txKey = (tx) => tx.transactionId ?? `${tx.productId}:${tx.state}`;
export class PurchaseStore {
    constructor(deps) {
        this.records = {};
        this.availability = 'initializing';
        this.products = new Map();
        this.transient = new Map();
        this.linkPending = false;
        this.linkConflict = false;
        this.isRestoring = false;
        this.storefront = undefined;
        this.plusUnlocked = false;
        this.plusPending = false;
        this.plusChecked = false;
        this.plusFlow = 'idle';
        this.plusProductsLoading = false;
        this.store = null;
        this.unsubscribeStore = null;
        this.loaded = null;
        this.plusLoaded = null;
        this.plusRevision = 0;
        this.plusProductsFetch = null;
        this.ledgerWritable = true;
        this.writeChain = Promise.resolve();
        this.productChains = new Map();
        this.draining = null;
        this.drainAgain = false;
        this.palByProduct = new Map();
        this.requestedProducts = new Set();
        this.watching = new Set();
        this.started = false;
        this.storefrontRead = false;
        this.recovering = null;
        this.recoverAgain = false;
        this.appStateSubscription = null;
        this.retries = new Map();
        this.invalidTxIds = new Set();
        this.finishedTxs = new Set();
        this.deps = deps;
        makeAutoObservable(this, {
            store: false,
            unsubscribeStore: false,
            deps: false,
            loaded: false,
            plusLoaded: false,
            plusRevision: false,
            plusProductsFetch: false,
            ledgerWritable: false,
            writeChain: false,
            productChains: false,
            draining: false,
            drainAgain: false,
            palByProduct: false,
            requestedProducts: false,
            watching: false,
            started: false,
            storefrontRead: false,
            recovering: false,
            recoverAgain: false,
            appStateSubscription: false,
            retries: false,
            invalidTxIds: false,
            finishedTxs: false,
            storePort: false,
        });
        reaction(() => [
            this.availability,
            this.deps.palStore.cachedPalsHubPals.map(pal => pal.store_product_id),
        ], () => {
            this.syncProducts();
        });
        reaction(() => this.availability === 'ready', ready => {
            if (ready) {
                this.fetchPlusProducts();
            }
        });
        reaction(() => this.deps.auth.isAuthenticated, signedIn => {
            if (signedIn && this.linkPending) {
                this.cancelLinkRequest();
                this.link().catch(() => { });
            }
        });
    }
    get storePort() {
        if (!this.store) {
            this.setStore(new NativeStore());
        }
        return this.store;
    }
    setStore(store) {
        this.unsubscribeStore?.();
        this.store = store;
        this.unsubscribeStore = store.onTransaction(tx => {
            this.processTransaction(tx, { settledVerify: true }).catch(() => { });
        });
    }
    get showsLicenseNotice() {
        return (Platform.OS === 'ios' &&
            (this.storefront === undefined || this.storefront === 'USA'));
    }
    get plusProducts() {
        return PLUS_PRODUCT_IDS.flatMap(id => {
            const product = this.products.get(id);
            return product ? [product] : [];
        });
    }
    productFor(productId) {
        return productId ? this.products.get(productId) : undefined;
    }
    recordFor(palId) {
        return this.records[palId];
    }
    recordForProduct(productId) {
        return Object.values(this.records).find(rec => rec.productId === productId);
    }
    isLegacyInstall(palId) {
        return (!this.records[palId] &&
            this.deps.palStore.pals.some(pal => pal.palshub_id === palId &&
                (pal.price_cents ?? 0) > 0 &&
                pal.is_owned === true));
    }
    isOwned(palId) {
        const status = this.records[palId]?.status;
        if (status === 'active' || status === 'granted') {
            return true;
        }
        if (this.deps.auth.isAuthenticated &&
            this.deps.palStore.userLibrary.some(pal => pal.id === palId)) {
            return true;
        }
        return this.isLegacyInstall(palId);
    }
    get storeOwnedRecords() {
        return Object.values(this.records).filter(rec => rec.status === 'active' ||
            rec.status === 'granted' ||
            rec.status === 'unfulfillable' ||
            rec.status === 'held_invalid');
    }
    get needsLink() {
        const userId = this.deps.auth.isAuthenticated
            ? this.deps.auth.user?.id
            : undefined;
        return Object.values(this.records).some(rec => rec.status === 'active' &&
            (userId ? rec.linkedUserId !== userId : !rec.linkedUserId));
    }
    updateAvailable(palId) {
        const rec = this.records[palId];
        return (rec?.status === 'active' &&
            rec.pendingUpdate !== undefined &&
            this.localPalFor(palId) !== undefined);
    }
    isStoreOwned(palId) {
        const status = this.records[palId]?.status;
        return status === 'active' || status === 'granted';
    }
    canBuy(pal) {
        return (this.availability === 'ready' &&
            pal.iap_enabled?.[platform()] === true &&
            this.productFor(pal.store_product_id) !== undefined &&
            !this.isOwned(pal.id) &&
            !pal.is_owned &&
            !isLive(this.records[pal.id]) &&
            !(pal.store_product_id &&
                isLive(this.recordForProduct(pal.store_product_id))));
    }
    flowFor(palId) {
        const transient = this.transient.get(palId);
        const rec = this.records[palId];
        if (transient === 'paying') {
            return 'paying';
        }
        if (transient === 'ready' && rec?.status === 'active') {
            return 'ready';
        }
        if (transient === 'invalid' && !rec) {
            return 'invalid';
        }
        if (transient === 'restore_needed' && !this.localPalFor(palId)) {
            return 'restore_needed';
        }
        if (!rec || rec.status === 'removed') {
            return 'idle';
        }
        return rec.status;
    }
    endSession(palId) {
        const transient = this.transient.get(palId);
        if (transient && transient !== 'paying') {
            this.transient.delete(palId);
        }
        this.watching.delete(palId);
    }
    setTransient(palId, phase) {
        runInAction(() => {
            if (phase) {
                this.transient.set(palId, phase);
            }
            else {
                this.transient.delete(palId);
            }
        });
    }
    readStorefront() {
        if (this.storefrontRead) {
            return;
        }
        this.storefrontRead = true;
        this.storePort
            .storefront()
            .then(code => runInAction(() => {
            this.storefront = code;
        }))
            .catch(() => { });
    }
    async syncProducts() {
        if (this.availability !== 'ready') {
            return;
        }
        await this.fetchPalProducts();
    }
    retryPlusProducts() {
        this.fetchPlusProducts();
    }
    fetchPlusProducts() {
        if (this.availability !== 'ready') {
            return Promise.resolve();
        }
        if (this.plusProductsFetch) {
            return this.plusProductsFetch;
        }
        const missing = PLUS_PRODUCT_IDS.filter(id => !this.products.has(id));
        if (missing.length === 0) {
            return Promise.resolve();
        }
        const run = Promise.resolve()
            .then(() => this.storePort.fetchProducts(missing))
            .then(products => runInAction(() => {
            products.forEach(product => this.products.set(product.productId, product));
        }), () => undefined)
            .finally(() => runInAction(() => {
            this.plusProductsFetch = null;
            this.plusProductsLoading = false;
        }));
        runInAction(() => {
            this.plusProductsFetch = run;
            this.plusProductsLoading = true;
        });
        return run;
    }
    async fetchPalProducts() {
        const wanted = this.deps.palStore.cachedPalsHubPals
            .filter(pal => pal.store_product_id && pal.iap_enabled?.[platform()])
            .map(pal => pal.store_product_id)
            .filter(id => !this.requestedProducts.has(id));
        if (wanted.length === 0) {
            return;
        }
        wanted.forEach(id => this.requestedProducts.add(id));
        try {
            const products = await this.storePort.fetchProducts(wanted);
            runInAction(() => {
                products.forEach(product => this.products.set(product.productId, product));
            });
        }
        catch {
            wanted.forEach(id => this.requestedProducts.delete(id));
        }
    }
    load() {
        if (!this.loaded) {
            this.loaded = this.loadLedger();
        }
        return this.loaded;
    }
    async loadLedger() {
        let raw = null;
        try {
            raw = await this.deps.storage.getItem(LEDGER_KEY);
        }
        catch {
            raw = null;
        }
        if (raw === null) {
            return;
        }
        try {
            const ledger = JSON.parse(raw);
            if (ledger?.version !== 1 || typeof ledger.records !== 'object') {
                throw new Error('unknown ledger version');
            }
            runInAction(() => {
                this.records = { ...ledger.records, ...this.records };
            });
        }
        catch {
            this.ledgerWritable = false;
        }
    }
    loadPlus() {
        if (!this.plusLoaded) {
            this.plusLoaded = this.readPlus();
        }
        return this.plusLoaded;
    }
    async readPlus() {
        let raw = null;
        try {
            raw = await this.deps.storage.getItem(PLUS_KEY);
        }
        catch {
            raw = null;
        }
        const unlocked = isPlusDoc(raw);
        runInAction(() => {
            this.plusUnlocked = unlocked;
        });
    }
    markLedgerWritable() {
        this.ledgerWritable = true;
    }
    persist(force = false) {
        if (!this.ledgerWritable && !force) {
            return this.writeChain;
        }
        if (force) {
            this.ledgerWritable = true;
        }
        const write = this.writeChain.then(() => this.deps.storage.setItem(LEDGER_KEY, JSON.stringify({ version: 1, records: toJS(this.records) })));
        this.writeChain = write.catch(() => undefined);
        return write;
    }
    async putRecord(palId, changes, force = false) {
        const meta = this.palByProduct.get(changes.productId);
        runInAction(() => {
            const base = this.records[palId] ?? {
                palId,
                source: 'store',
                productId: changes.productId,
                transactionIds: [],
                status: 'unlocking',
                title: meta?.title ?? '',
                thumbnailUrl: meta?.thumbnail_url,
                updatedAt: 0,
            };
            this.records[palId] = {
                ...base,
                ...changes,
                palId,
                title: changes.title ?? (base.title || meta?.title || ''),
                thumbnailUrl: changes.thumbnailUrl ?? base.thumbnailUrl ?? meta?.thumbnail_url,
                updatedAt: this.deps.now(),
            };
        });
        await this.persist(force);
        return this.records[palId];
    }
    async deleteRecord(palId, force = false) {
        runInAction(() => {
            delete this.records[palId];
        });
        await this.persist(force);
    }
    palIdForProduct(productId) {
        return (this.recordForProduct(productId)?.palId ??
            this.palByProduct.get(productId)?.id ??
            this.deps.palStore.cachedPalsHubPals.find(pal => pal.store_product_id === productId)?.id ??
            this.deps.palStore.userLibrary.find(pal => pal.store_product_id === productId)?.id ??
            productId);
    }
    withTransactionId(rec, tx) {
        const ids = rec?.transactionIds ?? [];
        return tx.transactionId && !ids.includes(tx.transactionId)
            ? [...ids, tx.transactionId]
            : ids;
    }
    serialize(productId, task) {
        const previous = this.productChains.get(productId) ?? Promise.resolve();
        const run = previous.catch(() => undefined).then(task);
        this.productChains.set(productId, run);
        run
            .finally(() => {
            if (this.productChains.get(productId) === run) {
                this.productChains.delete(productId);
            }
        })
            .catch(() => undefined);
        return run;
    }
    processTransaction(tx, opts = {}) {
        if (isPlusTransaction(tx)) {
            return this.serialize(PLUS_CHAIN, () => this.runPlus(tx));
        }
        return this.serialize(tx.productId, () => this.runTransaction(tx, opts));
    }
    async runPlus(tx) {
        await this.loadPlus();
        if (tx.state === 'pending') {
            this.markPlusPending();
            return;
        }
        runInAction(() => {
            this.plusUnlocked = true;
            this.plusPending = false;
        });
        this.plusRevision += 1;
        if (!(await this.plusDocOnDisk())) {
            const doc = {
                version: 1,
                productId: tx.productId,
                unlockedAt: this.deps.now(),
            };
            try {
                await this.deps.storage.setItem(PLUS_KEY, JSON.stringify(doc));
            }
            catch (error) {
                console.warn('Saving the Plus unlock failed:', error);
                return;
            }
        }
        if (tx.unfinished) {
            await this.finish(tx);
        }
    }
    async plusDocOnDisk() {
        try {
            return isPlusDoc(await this.deps.storage.getItem(PLUS_KEY));
        }
        catch {
            return false;
        }
    }
    async settlePlus(txs, ok, snapshot, fromRestore) {
        await this.processPlusTransactions(txs);
        await this.reconcilePlus(txs, ok, snapshot, fromRestore);
    }
    async processPlusTransactions(txs) {
        for (const tx of txs.filter(isPlusTransaction)) {
            await this.processTransaction(tx);
        }
    }
    reconcilePlus(txs, ok, snapshot, fromRestore) {
        return this.serialize(PLUS_CHAIN, async () => {
            await this.loadPlus();
            if (ok && this.plusRevision === snapshot) {
                const plus = txs.filter(isPlusTransaction);
                if (this.plusUnlocked && !plus.some(tx => tx.state === 'purchased')) {
                    await this.relockPlus();
                }
                if (Platform.OS === 'android') {
                    const listedPending = plus.some(tx => tx.state === 'pending');
                    runInAction(() => {
                        this.plusPending = listedPending && !this.plusUnlocked;
                    });
                }
                else if (fromRestore) {
                    runInAction(() => {
                        this.plusPending = false;
                    });
                }
            }
            this.markPlusChecked();
        });
    }
    async relockPlus() {
        runInAction(() => {
            this.plusUnlocked = false;
        });
        try {
            await this.deps.storage.removeItem(PLUS_KEY);
        }
        catch (error) {
            console.warn('Removing the Plus unlock failed:', error);
        }
    }
    markPlusChecked() {
        runInAction(() => {
            this.plusChecked = true;
        });
    }
    markPlusPending() {
        if (this.plusUnlocked) {
            return;
        }
        runInAction(() => {
            this.plusPending = true;
        });
        this.plusRevision += 1;
    }
    async finish(tx) {
        const key = txKey(tx);
        if (this.finishedTxs.has(key)) {
            return;
        }
        try {
            await this.storePort.finish(tx);
            this.finishedTxs.add(key);
        }
        catch (error) {
            console.warn('Finishing the transaction failed:', error);
        }
    }
    resetAndroidAckMemo() {
        if (Platform.OS === 'android') {
            this.finishedTxs.clear();
        }
    }
    async finishOnIOS(tx) {
        if (Platform.OS === 'ios') {
            await this.finish(tx);
        }
    }
    async verify(tx) {
        try {
            const results = await this.deps.api.verify(platform(), [tx.proof]);
            const result = results.find(candidate => candidate.status === 'active') ?? results[0];
            if (result?.status === 'active' && !result.supportCode) {
                console.warn('Verify returned an active purchase without a support code:', result.palId);
            }
            return result && !RETRYABLE_RESULTS.has(result.status) ? result : null;
        }
        catch {
            return null;
        }
    }
    async runTransaction(tx, opts) {
        await this.deps.palStore.ready;
        await this.load();
        const rec = this.recordForProduct(tx.productId);
        if (rec && isSettled(rec.status) && !reopensTombstone(rec, tx)) {
            this.clearRetry(tx.productId);
            await this.runSettled(rec, tx, opts);
            return;
        }
        const palId = rec?.palId ?? this.palIdForProduct(tx.productId);
        if (!opts.install && this.invalidTxIds.has(txKey(tx))) {
            return;
        }
        if (tx.state === 'pending') {
            if (!isLive(rec)) {
                await this.putRecord(palId, {
                    productId: tx.productId,
                    status: 'pending_payment',
                    pendingSince: this.deps.now(),
                });
            }
            return;
        }
        await this.putRecord(palId, {
            productId: tx.productId,
            status: 'unlocking',
            pendingSince: undefined,
            transactionIds: this.withTransactionId(rec, tx),
        });
        const result = await this.verify(tx);
        if (!result) {
            this.scheduleRetry(tx);
            return;
        }
        this.clearRetry(tx.productId);
        const key = this.rekey(palId, result.palId);
        switch (result.status) {
            case 'active':
                await this.writeGrant(key, tx, result);
                if (tx.unfinished || Platform.OS === 'ios') {
                    await this.finish(tx);
                }
                this.drainQueue().catch(() => { });
                return;
            case 'pending':
                await this.putRecord(key, {
                    productId: tx.productId,
                    status: 'pending_payment',
                    pendingSince: this.deps.now(),
                });
                return;
            case 'unfulfillable':
                await this.putRecord(key, {
                    productId: tx.productId,
                    status: 'unfulfillable',
                    supportCode: result.supportCode,
                    ...(result.pal ? { title: result.pal.title } : {}),
                }, true);
                await this.finishOnIOS(tx);
                return;
            case 'revoked':
                await this.removeOwnership(key);
                await this.finishOnIOS(tx);
                return;
            case 'removed':
                await this.withdraw(key, result.supportCode);
                await this.finishOnIOS(tx);
                return;
            case 'invalid':
                if (result.supportCode) {
                    await this.putRecord(key, {
                        productId: tx.productId,
                        status: 'held_invalid',
                        supportCode: result.supportCode,
                    }, true);
                }
                else {
                    await this.deleteRecord(key, true);
                    this.setTransient(key, 'invalid');
                }
                await this.finishOnIOS(tx);
                this.invalidTxIds.add(txKey(tx));
                this.deps.events.send(key, 'purchase_error');
                return;
        }
    }
    async runSettled(rec, tx, opts) {
        if (tx.unfinished) {
            const delivered = tx.state === 'purchased' &&
                (rec.status === 'active' || rec.status === 'granted');
            await (delivered ? this.finish(tx) : this.finishOnIOS(tx));
        }
        if (rec.status === 'held_invalid') {
            if (opts.install) {
                await this.reverifyHeld(rec, tx);
            }
            return;
        }
        if (rec.status === 'unfulfillable' || !opts.settledVerify) {
            return;
        }
        const result = await this.verify(tx);
        if (!result) {
            return;
        }
        if (rec.status === 'removed') {
            if (result.status === 'active') {
                await this.writeGrant(rec.palId, tx, result);
                if (tx.unfinished) {
                    await this.finish(tx);
                }
                this.drainQueue().catch(() => { });
            }
            return;
        }
        if (result.status === 'revoked') {
            await this.removeOwnership(rec.palId);
            return;
        }
        if (result.status === 'removed') {
            await this.withdraw(rec.palId, result.supportCode);
            return;
        }
        if (rec.status === 'granted' || result.status !== 'active' || !result.pal) {
            return;
        }
        if (rec.supportCode !== result.supportCode) {
            await this.putRecord(rec.palId, {
                productId: rec.productId,
                supportCode: result.supportCode,
            });
        }
        if (this.localPalFor(rec.palId)) {
            if (result.content) {
                await this.offerUpdate(rec.palId, {
                    pal: result.pal,
                    content: result.content,
                    contentVersion: result.contentVersion ?? UNKNOWN_CONTENT_VERSION,
                    changeNote: result.changeNote,
                });
            }
            return;
        }
        if (opts.install) {
            await this.writeGrant(rec.palId, tx, result);
            await this.drainQueue();
        }
    }
    async reverifyHeld(rec, tx) {
        const result = await this.verify(tx);
        switch (result?.status) {
            case 'active':
                this.invalidTxIds.delete(txKey(tx));
                await this.writeGrant(rec.palId, tx, result);
                if (tx.unfinished) {
                    await this.finish(tx);
                }
                await this.drainQueue();
                return;
            case 'revoked':
                await this.removeOwnership(rec.palId);
                return;
            case 'removed':
                await this.withdraw(rec.palId, result.supportCode);
                return;
            case 'unfulfillable':
                await this.putRecord(rec.palId, {
                    productId: rec.productId,
                    status: 'unfulfillable',
                    supportCode: result.supportCode ?? rec.supportCode,
                }, true);
                return;
        }
    }
    rekey(from, to) {
        if (from !== to && this.records[from]) {
            runInAction(() => {
                const previous = this.records[from];
                delete this.records[from];
                this.records[to] = { ...this.records[to], ...previous, palId: to };
            });
        }
        return to;
    }
    async writeGrant(palId, tx, result) {
        const rec = this.records[palId];
        await this.putRecord(palId, {
            productId: tx.productId,
            status: 'granted',
            grant: result.pal && result.content
                ? {
                    pal: result.pal,
                    content: result.content,
                    contentVersion: result.contentVersion,
                    changeNote: result.changeNote,
                }
                : undefined,
            pendingUpdate: undefined,
            supportCode: result.supportCode,
            transactionIds: this.withTransactionId(rec, tx),
            title: result.pal?.title ?? rec?.title ?? '',
            thumbnailUrl: result.pal?.thumbnail_url ?? rec?.thumbnailUrl,
            pendingSince: undefined,
        }, true);
    }
    localPalFor(palId) {
        return this.deps.palStore.pals.find(pal => pal.palshub_id === palId);
    }
    async offerUpdate(palId, update) {
        const rec = this.records[palId];
        if (rec?.status !== 'active' ||
            !this.localPalFor(palId) ||
            !update.pal.system_prompt ||
            update.contentVersion === rec.contentVersion ||
            update.contentVersion === rec.pendingUpdate?.contentVersion) {
            return;
        }
        if (changedCreatorFields(rec.applied, update.content).size === 0) {
            await this.putRecord(palId, {
                productId: rec.productId,
                contentVersion: update.contentVersion,
                applied: update.content,
                pendingUpdate: undefined,
            });
            return;
        }
        await this.putRecord(palId, {
            productId: rec.productId,
            pendingUpdate: update,
        });
    }
    async applyUpdate(palId, shownVersion) {
        await this.load();
        const productId = this.records[palId]?.productId;
        if (!productId) {
            return;
        }
        await this.serialize(productId, async () => {
            const rec = this.records[palId];
            const pending = rec?.pendingUpdate;
            const local = this.localPalFor(palId);
            if (rec?.status !== 'active' ||
                !pending ||
                pending.contentVersion !== shownVersion ||
                !local) {
                return;
            }
            const { thumbnailFailed } = await this.deps.palStore.applyCreatorUpdate(local.id, pending.pal, changedCreatorFields(rec.applied, pending.content));
            await this.putRecord(palId, {
                productId,
                contentVersion: pending.contentVersion,
                applied: thumbnailFailed
                    ? { ...pending.content, thumbnail_url: rec.applied?.thumbnail_url }
                    : pending.content,
                pendingUpdate: undefined,
                title: pending.pal.title,
                thumbnailUrl: thumbnailFailed
                    ? rec.thumbnailUrl
                    : (pending.pal.thumbnail_url ?? rec.thumbnailUrl),
            });
        });
    }
    async removeOwnership(palId) {
        const rec = this.records[palId];
        if (!rec) {
            return;
        }
        await this.putRecord(palId, {
            productId: rec.productId,
            status: 'removed',
            grant: undefined,
            pendingUpdate: undefined,
            ...(this.keptByLibrary(palId) ? {} : { applied: undefined }),
        }, true);
        await this.deleteLocalUnlessLibrary(palId);
    }
    async withdraw(palId, supportCode) {
        const rec = this.records[palId];
        if (!rec) {
            return;
        }
        await this.putRecord(palId, {
            productId: rec.productId,
            status: 'unfulfillable',
            supportCode: supportCode ?? rec.supportCode,
            ...(rec.status === 'active' || rec.status === 'granted'
                ? { withdrawnAfterDelivery: true }
                : {}),
            grant: undefined,
            pendingUpdate: undefined,
            applied: undefined,
        }, true);
        await this.deleteLocalUnlessLibrary(palId);
    }
    keptByLibrary(palId) {
        return (this.localPalFor(palId) !== undefined &&
            this.deps.auth.isAuthenticated &&
            this.deps.palStore.userLibrary.some(pal => pal.id === palId));
    }
    async deleteLocalUnlessLibrary(palId) {
        const local = this.localPalFor(palId);
        if (local && !this.keptByLibrary(palId)) {
            await this.deps.palStore.deletePal(local.id);
        }
    }
    drainQueue() {
        if (this.draining) {
            this.drainAgain = true;
            return this.draining;
        }
        const run = (async () => {
            do {
                this.drainAgain = false;
                await this.drainOnce();
            } while (this.drainAgain);
        })();
        this.draining = run.finally(() => {
            this.draining = null;
        });
        return this.draining;
    }
    async drainOnce() {
        await this.deps.palStore.ready;
        await this.load();
        const granted = Object.values(this.records).filter(rec => rec.status === 'granted' && rec.grant);
        for (const rec of granted) {
            try {
                const grant = rec.grant;
                const { created } = await this.deps.palStore.installOwnedPal(grant.pal);
                await this.putRecord(rec.palId, {
                    productId: rec.productId,
                    status: 'active',
                    grant: undefined,
                    ...this.adoptGrant(rec, grant, created),
                });
                if (this.watching.has(rec.palId)) {
                    this.setTransient(rec.palId, 'ready');
                }
                if (this.deps.auth.isAuthenticated) {
                    this.link().catch(() => { });
                }
            }
            catch (error) {
                console.warn('Installing a purchased Pal failed:', error);
            }
        }
    }
    adoptGrant(rec, grant, created) {
        const version = grant.contentVersion ?? rec.contentVersion;
        if (created || !rec.applied) {
            return { applied: grant.content, contentVersion: version };
        }
        if (changedCreatorFields(rec.applied, grant.content).size > 0) {
            return {
                pendingUpdate: {
                    ...grant,
                    contentVersion: version ?? UNKNOWN_CONTENT_VERSION,
                },
            };
        }
        return { contentVersion: version };
    }
    rememberPal(pal) {
        if (pal.store_product_id) {
            this.palByProduct.set(pal.store_product_id, pal);
        }
    }
    async buy(pal) {
        const productId = pal.store_product_id;
        if (!productId || !this.canBuy(pal)) {
            return 'stay';
        }
        this.rememberPal(pal);
        this.watching.add(pal.id);
        this.setTransient(pal.id, 'paying');
        this.deps.events.send(pal.id, 'buy_tap');
        try {
            const binding = this.deps.auth.isAuthenticated
                ? await this.deps.binding.getBinding()
                : null;
            const outcome = await this.storePort.purchase(productId, binding);
            this.setTransient(pal.id, undefined);
            switch (outcome.kind) {
                case 'purchased':
                    await this.processTransaction(outcome.tx, { settledVerify: true });
                    return 'stay';
                case 'pending':
                    await this.recordPending(pal.id, productId);
                    return 'stay';
                case 'already_owned': {
                    const listed = await this.installOwned(pal);
                    const rec = this.records[pal.id] ?? this.recordForProduct(productId);
                    if (listed && rec?.status === 'removed') {
                        this.deps.events.send(pal.id, 'purchase_error');
                        return 'close';
                    }
                    return 'stay';
                }
                case 'cancelled':
                    this.deps.events.send(pal.id, 'purchase_cancelled');
                    return 'close';
                default:
                    this.deps.events.send(pal.id, 'purchase_error');
                    return 'close';
            }
        }
        finally {
            if (this.transient.get(pal.id) === 'paying') {
                this.setTransient(pal.id, undefined);
            }
        }
    }
    async buyPlus(productId) {
        await this.loadPlus();
        if (!this.canBuyPlus(productId)) {
            return 'error';
        }
        runInAction(() => {
            this.plusFlow = 'paying';
        });
        try {
            const outcome = await this.storePort.purchase(productId, null);
            switch (outcome.kind) {
                case 'purchased':
                    await this.processTransaction(outcome.tx);
                    return 'purchased';
                case 'pending':
                    await this.serialize(PLUS_CHAIN, async () => this.markPlusPending());
                    return 'pending';
                case 'already_owned':
                    return (await this.deliverOwnedPlus()) ? 'purchased' : 'error';
                case 'cancelled':
                    return 'cancelled';
                default:
                    return 'error';
            }
        }
        catch (error) {
            console.warn('Buying Plus failed:', error);
            return 'error';
        }
        finally {
            runInAction(() => {
                this.plusFlow = 'idle';
            });
        }
    }
    canBuyPlus(productId) {
        return (isPlusProduct(productId) &&
            this.availability === 'ready' &&
            this.plusChecked &&
            this.products.has(productId) &&
            !this.plusUnlocked &&
            !this.plusPending &&
            this.plusFlow === 'idle');
    }
    async deliverOwnedPlus() {
        const { transactions } = await this.storePort.currentEntitlements();
        await this.processPlusTransactions(transactions);
        return this.plusUnlocked;
    }
    recordPending(palId, productId) {
        return this.serialize(productId, async () => {
            await this.load();
            const rec = this.recordForProduct(productId);
            const open = isLive(rec) ? rec : undefined;
            if (open && open.status !== 'pending_payment') {
                return;
            }
            await this.putRecord(rec?.palId ?? palId, {
                productId,
                status: 'pending_payment',
                pendingSince: open?.pendingSince ?? this.deps.now(),
            });
        });
    }
    async start({ store, beforeInit } = {}) {
        if (this.started) {
            return;
        }
        this.started = true;
        this.loadPlus().catch(() => { });
        await beforeInit?.();
        if (store) {
            this.setStore(store);
        }
        this.appStateSubscription = AppState.addEventListener('change', state => {
            if (state === 'active') {
                this.recover().catch(() => { });
            }
            else {
                this.pauseRetries();
            }
        });
        await this.deps.palStore.ready;
        await this.recover();
    }
    stop() {
        this.appStateSubscription?.remove();
        this.appStateSubscription = null;
        this.unsubscribeStore?.();
        this.unsubscribeStore = null;
        this.pauseRetries();
        this.started = false;
    }
    recover() {
        if (this.recovering) {
            this.recoverAgain = true;
            return this.recovering;
        }
        const run = (async () => {
            do {
                this.recoverAgain = false;
                await this.recoverOnce();
            } while (this.recoverAgain);
        })();
        this.recovering = run.finally(() => {
            this.recovering = null;
        });
        return this.recovering;
    }
    async recoverOnce() {
        try {
            await this.recoverStore();
        }
        catch (error) {
            await this.loadPlus();
            this.markPlusChecked();
            throw error;
        }
    }
    async recoverStore() {
        await this.deps.palStore.ready;
        await this.load();
        const available = await this.storePort.init();
        runInAction(() => {
            this.availability = available ? 'ready' : 'unavailable';
        });
        if (available) {
            this.readStorefront();
        }
        await this.drainQueue();
        if (!available) {
            return;
        }
        const unconfirmed = this.androidUnconfirmedRecords();
        this.resetAndroidAckMemo();
        const snapshot = this.plusRevision;
        const { ok, transactions: txs } = await this.storeTransactions();
        await this.settlePlus(txs, ok, snapshot, false);
        for (const tx of txs.filter(isPalTransaction)) {
            if (this.invalidTxIds.has(txKey(tx))) {
                continue;
            }
            const rec = this.recordForProduct(tx.productId);
            if (!isSettled(rec?.status) || tx.unfinished) {
                await this.processTransaction(tx, {});
            }
        }
        await this.dropStalePending(txs, false, ok, unconfirmed);
        if (!ok) {
            return;
        }
        const refreshed = await this.refresh(txs);
        if (refreshed) {
            this.markLedgerWritable();
        }
    }
    async storeTransactions() {
        const [unfinished, { ok, transactions: entitled }] = await Promise.all([
            this.storePort.unfinished().catch(() => []),
            this.storePort.currentEntitlements(),
        ]);
        const merged = new Map();
        [...unfinished, ...entitled].forEach(tx => {
            const key = txKey(tx);
            const seen = merged.get(key);
            merged.set(key, seen ? { ...seen, unfinished: seen.unfinished || tx.unfinished } : tx);
        });
        return { ok, transactions: [...merged.values()] };
    }
    androidUnconfirmedRecords() {
        return Platform.OS === 'android'
            ? Object.values(this.records)
                .filter(rec => rec.status === 'held_invalid' || rec.status === 'unlocking')
                .map(({ palId, status }) => ({ palId, status }))
            : [];
    }
    async dropStalePending(txs, force, queryOk, unconfirmed) {
        const stale = Object.values(this.records).filter(rec => {
            if (rec.status !== 'pending_payment') {
                return false;
            }
            if (txs.some(tx => tx.productId === rec.productId)) {
                return false;
            }
            if (Platform.OS === 'android') {
                return queryOk;
            }
            return (force ||
                this.deps.now() - (rec.pendingSince ?? this.deps.now()) >
                    STALE_PENDING_MS);
        });
        for (const rec of stale) {
            await this.serialize(rec.productId, async () => {
                if (this.records[rec.palId]?.status === 'pending_payment') {
                    await this.deleteRecord(rec.palId);
                }
            });
        }
        if (!queryOk) {
            return;
        }
        for (const { palId, status } of unconfirmed) {
            const rec = this.records[palId];
            if (!rec || txs.some(tx => tx.productId === rec.productId)) {
                continue;
            }
            await this.serialize(rec.productId, async () => {
                if (this.records[palId]?.status === status) {
                    this.clearRetry(rec.productId);
                    await this.deleteRecord(palId);
                }
            });
        }
    }
    async refresh(txs) {
        const proofs = txs
            .filter(tx => tx.state === 'purchased' && isPalTransaction(tx))
            .map(tx => tx.proof);
        const known = Object.fromEntries(Object.values(this.records)
            .filter(rec => rec.status === 'active' && rec.supportCode)
            .map(rec => [
            rec.palId,
            {
                contentVersion: rec.pendingUpdate?.contentVersion ?? rec.contentVersion,
                purchaseRef: rec.supportCode,
            },
        ]));
        if (proofs.length === 0 && Object.keys(known).length === 0) {
            return true;
        }
        let refreshed;
        try {
            refreshed = await this.deps.api.refresh(platform(), proofs, known);
        }
        catch {
            return false;
        }
        for (const { pal, content, contentVersion, changeNote, } of refreshed.changed) {
            const rec = this.records[pal.id];
            if (rec?.status === 'active') {
                await this.serialize(rec.productId, () => this.offerUpdate(pal.id, {
                    pal,
                    content,
                    contentVersion: contentVersion ?? UNKNOWN_CONTENT_VERSION,
                    changeNote,
                }));
            }
        }
        const removals = [
            ...refreshed.revoked.map(palId => ({ palId, withdrawn: false })),
            ...refreshed.removed.map(palId => ({ palId, withdrawn: true })),
        ];
        for (const { palId, withdrawn } of removals) {
            const rec = this.records[palId];
            if (rec &&
                rec.status !== 'removed' &&
                rec.status !== 'unfulfillable' &&
                !(Platform.OS === 'android' && rec.status === 'held_invalid')) {
                await this.serialize(rec.productId, () => withdrawn ? this.withdraw(palId) : this.removeOwnership(palId));
            }
        }
        return true;
    }
    scheduleRetry(tx) {
        const previous = this.retries.get(tx.productId);
        if (previous?.timer) {
            clearTimeout(previous.timer);
        }
        const attempt = previous?.attempt ?? 0;
        const delay = RETRY_DELAYS_MS[attempt] ?? RETRY_STEADY_MS;
        const entry = { attempt: attempt + 1, tx };
        entry.timer = setTimeout(() => {
            entry.timer = undefined;
            this.processTransaction(tx, {}).catch(() => { });
        }, delay);
        this.retries.set(tx.productId, entry);
    }
    clearRetry(productId) {
        const entry = this.retries.get(productId);
        if (entry?.timer) {
            clearTimeout(entry.timer);
        }
        this.retries.delete(productId);
    }
    pauseRetries() {
        this.retries.forEach(entry => {
            if (entry.timer) {
                clearTimeout(entry.timer);
                entry.timer = undefined;
            }
        });
    }
    async retry(palId) {
        await this.load();
        const rec = this.records[palId];
        if (!rec || isSettled(rec.status)) {
            return;
        }
        const pending = this.retries.get(rec.productId);
        const tx = pending?.tx ??
            (await this.storeTransactions()).transactions.find(candidate => candidate.productId === rec.productId);
        if (!tx) {
            return;
        }
        if (pending?.timer) {
            clearTimeout(pending.timer);
        }
        this.retries.set(rec.productId, { attempt: 0, tx });
        await this.processTransaction(tx, {});
    }
    requestLink() {
        if (!ACCOUNT_LINK_ENABLED) {
            return;
        }
        this.linkPending = true;
    }
    cancelLinkRequest() {
        this.linkPending = false;
    }
    async link() {
        const userId = this.deps.auth.user?.id;
        if (!ACCOUNT_LINK_ENABLED || !this.deps.auth.isAuthenticated || !userId) {
            return undefined;
        }
        await this.load();
        const unlinked = Object.values(this.records).filter(rec => rec.status === 'active' && rec.linkedUserId !== userId);
        if (unlinked.length === 0) {
            return undefined;
        }
        const { transactions } = await this.storePort.currentEntitlements();
        const txs = transactions.filter(tx => tx.state === 'purchased' &&
            unlinked.some(rec => rec.productId === tx.productId));
        if (txs.length === 0) {
            return undefined;
        }
        let outcome;
        try {
            outcome = await this.deps.api.link(platform(), txs.map(tx => tx.proof));
        }
        catch {
            return undefined;
        }
        runInAction(() => {
            this.linkConflict = outcome === 'conflict';
        });
        if (outcome === 'linked') {
            for (const rec of unlinked) {
                if (txs.some(tx => tx.productId === rec.productId)) {
                    await this.putRecord(rec.palId, {
                        productId: rec.productId,
                        linkedUserId: userId,
                    });
                }
            }
        }
        return outcome;
    }
    async restore() {
        runInAction(() => {
            this.isRestoring = true;
        });
        try {
            await this.deps.palStore.ready;
            await this.load();
            if (this.availability !== 'ready') {
                await (this.recovering ?? this.recover()).catch(() => { });
            }
            try {
                await this.storePort.sync();
            }
            catch (error) {
                console.warn('Store sync failed:', error);
            }
            await this.drainQueue();
            const unconfirmed = this.androidUnconfirmedRecords();
            this.resetAndroidAckMemo();
            const snapshot = this.plusRevision;
            const { ok, transactions: txs } = await this.storePort.currentEntitlements();
            await this.settlePlus(txs, ok, snapshot, true);
            for (const tx of txs.filter(isPalTransaction)) {
                await this.processTransaction(tx, { settledVerify: true, install: true });
            }
            await this.dropStalePending(txs, true, ok, unconfirmed);
            return { queryOk: ok };
        }
        finally {
            runInAction(() => {
                this.isRestoring = false;
            });
        }
    }
    async installOwned(pal) {
        this.rememberPal(pal);
        this.watching.add(pal.id);
        const productId = this.records[pal.id]?.productId ?? pal.store_product_id;
        const txs = productId
            ? (await this.storePort.currentEntitlements()).transactions
            : [];
        const tx = txs.find(candidate => candidate.productId === productId && candidate.state === 'purchased');
        if (!tx) {
            this.setTransient(pal.id, 'restore_needed');
            return false;
        }
        this.setTransient(pal.id, undefined);
        await this.processTransaction(tx, { settledVerify: true, install: true });
        return true;
    }
}
export const purchaseStore = new PurchaseStore({
    api: iapApi,
    binding: bindingSource,
    palStore: defaultPalStore,
    auth: authService,
    storage: AsyncStorage,
    now: () => Date.now(),
    events: palEvents,
});
