import { Platform } from 'react-native';
import { fetchProducts, finishTransaction, getAvailablePurchases, getPendingTransactionsIOS, getStorefront, initConnection, purchaseErrorListener, purchaseUpdatedListener, requestPurchase, syncIOS, } from 'react-native-iap';
import { outcomeForErrorCode } from './storeOutcomes';
export const EARLIER_TRANSACTION_MS = 60000;
export const PURCHASE_SETTLE_GRACE_MS = 5000;
const toTransaction = (purchase, unfinished) => {
    const token = purchase.purchaseToken ?? undefined;
    if (!token) {
        return null;
    }
    const state = purchase.purchaseState === 'purchased' ? 'purchased' : 'pending';
    if (Platform.OS === 'ios') {
        return {
            productId: purchase.productId,
            transactionId: purchase.id,
            state,
            unfinished,
            proof: { platform: 'ios', jws: token },
            handle: purchase,
        };
    }
    return {
        productId: purchase.productId,
        transactionId: 'transactionId' in purchase && purchase.transactionId
            ? purchase.transactionId
            : undefined,
        state,
        unfinished: state === 'purchased' &&
            !('isAcknowledgedAndroid' in purchase && purchase.isAcknowledgedAndroid),
        proof: {
            platform: 'android',
            productId: purchase.productId,
            purchaseToken: token,
        },
        handle: purchase,
    };
};
const outcomeForPurchase = (purchase, unfinished, startedAt) => {
    const tx = toTransaction(purchase, unfinished);
    if (!tx) {
        return null;
    }
    if (tx.state === 'pending') {
        return { kind: 'pending' };
    }
    if (Platform.OS === 'ios' &&
        purchase.transactionDate < startedAt - EARLIER_TRANSACTION_MS) {
        return { kind: 'already_owned' };
    }
    return { kind: 'purchased', tx };
};
const UNSETTLED_PURCHASE = { kind: 'error', code: 'unknown' };
const outcomeFromStoreIOS = async (productId, startedAt) => {
    let unfinished;
    let entitled;
    try {
        [unfinished, entitled] = await Promise.all([
            getPendingTransactionsIOS(),
            getAvailablePurchases({ onlyIncludeActiveItemsIOS: true }),
        ]);
    }
    catch {
        return UNSETTLED_PURCHASE;
    }
    const candidates = [
        ...unfinished.map(purchase => ({ purchase, unfinished: true })),
        ...entitled.map(purchase => ({ purchase, unfinished: false })),
    ].filter(({ purchase }) => purchase.productId === productId);
    for (const candidate of candidates) {
        const outcome = outcomeForPurchase(candidate.purchase, candidate.unfinished, startedAt);
        if (outcome) {
            return outcome;
        }
    }
    return UNSETTLED_PURCHASE;
};
const errorCode = (error) => error?.code;
export class NativeStore {
    async init() {
        try {
            return (await initConnection()) === true;
        }
        catch {
            return false;
        }
    }
    async fetchProducts(productIds) {
        if (productIds.length === 0) {
            return [];
        }
        const products = await fetchProducts({ skus: productIds, type: 'in-app' });
        return (products ?? []).map(product => ({
            productId: product.id,
            displayPrice: product.displayPrice,
        }));
    }
    async storefront() {
        if (Platform.OS !== 'ios') {
            return undefined;
        }
        // A failed lookup emits an id-less purchase error; with no listener,
        // iOS buffers it and hands it to the next Buy, which then fails.
        const drain = purchaseErrorListener(() => { });
        try {
            return await getStorefront();
        }
        catch {
            return undefined;
        }
        finally {
            drain.remove();
        }
    }
    purchase(productId, binding) {
        const startedAt = Date.now();
        return new Promise(resolve => {
            let settled = false;
            let graceTimer;
            const subscriptions = [];
            const settle = (outcome) => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(graceTimer);
                subscriptions.forEach(subscription => subscription.remove());
                resolve(outcome);
            };
            subscriptions.push(purchaseUpdatedListener(purchase => {
                if (purchase.productId !== productId) {
                    return;
                }
                const outcome = outcomeForPurchase(purchase, Platform.OS === 'ios', startedAt);
                if (outcome) {
                    settle(outcome);
                }
            }, { dedupeTransactionIOS: false }), purchaseErrorListener(error => {
                if (error.productId && error.productId !== productId) {
                    return;
                }
                settle(outcomeForErrorCode(error.code));
            }));
            requestPurchase({
                request: {
                    apple: {
                        sku: productId,
                        ...(binding?.appAccountToken
                            ? { appAccountToken: binding.appAccountToken }
                            : {}),
                    },
                    google: {
                        skus: [productId],
                        ...(binding?.obfuscatedAccountId
                            ? { obfuscatedAccountId: binding.obfuscatedAccountId }
                            : {}),
                    },
                },
                type: 'in-app',
            }).then(() => {
                if (settled || Platform.OS !== 'ios') {
                    return;
                }
                graceTimer = setTimeout(() => {
                    outcomeFromStoreIOS(productId, startedAt).then(settle);
                }, PURCHASE_SETTLE_GRACE_MS);
            }, error => settle(outcomeForErrorCode(errorCode(error))));
        });
    }
    async unfinished() {
        if (Platform.OS !== 'ios') {
            return [];
        }
        const purchases = await getPendingTransactionsIOS();
        return purchases
            .map(purchase => toTransaction(purchase, true))
            .filter((tx) => tx !== null);
    }
    async currentEntitlements() {
        try {
            const purchases = await getAvailablePurchases({
                onlyIncludeActiveItemsIOS: true,
            });
            return {
                ok: true,
                transactions: purchases
                    .map(purchase => toTransaction(purchase, false))
                    .filter((tx) => tx !== null),
            };
        }
        catch {
            return { ok: false, transactions: [] };
        }
    }
    async sync() {
        if (Platform.OS === 'ios') {
            await syncIOS();
        }
    }
    async finish(tx) {
        await finishTransaction({
            purchase: tx.handle,
            isConsumable: false,
        });
    }
    onTransaction(listener) {
        const subscription = purchaseUpdatedListener(purchase => {
            const tx = toTransaction(purchase, Platform.OS === 'ios');
            if (tx) {
                listener(tx);
            }
        });
        return () => subscription.remove();
    }
}
