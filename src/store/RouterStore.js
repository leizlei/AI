import { comparer, makeAutoObservable, makeObservable, observable, reaction, runInAction, } from 'mobx';
import { serverStore } from './ServerStore';
import { profileFor } from '../api/servers';
import { openRouterEvents, postLoad, postUnload, } from '../api/llamaServer/router';
import { hasRouterStatus, loadFraction, reduceRouterEvent, rowExitCode, rowStateFromList, serverReason, } from '../api/llamaServer/routerWire';
import { loadFailure, loadMaxFailure, loadVerdict, unloadReleased, unloadSettleFailure, unreachableFailure, } from './routerVerdicts';
import { RemoteModelNotReadyError, RemoteModelRequestWithdrawnError, } from '../utils/errors';
export const ROUTER_POLL_MS = 4000;
export const ROUTER_TICK_MS = 1000;
export const ROUTER_ACK_MS = 20000;
export const ROUTER_EVIDENCE_MS = 45000;
export const ROUTER_UNREACHABLE_MS = 90000;
export const ROUTER_LOAD_MAX_MS = 10 * 60 * 1000;
/** Longer than the 10 s the server allows a child to stop. */
export const ROUTER_UNLOAD_SETTLE_MS = 30000;
const keyOf = (serverId, remoteModelId) => `${serverId}/${remoteModelId}`;
const isSuccess = (status) => status >= 200 && status < 300;
const noop = () => { };
/** The promise's value, or `stopped` as soon as the signal aborts. */
function untilAborted(promise, signal) {
    if (!signal) {
        return promise;
    }
    if (signal.aborted) {
        return Promise.resolve('stopped');
    }
    return new Promise(resolve => {
        const onAbort = () => resolve('stopped');
        signal.addEventListener('abort', onAbort, { once: true });
        promise.then(value => {
            signal.removeEventListener('abort', onAbort);
            resolve(value);
        });
    });
}
/** A load's shown fraction never falls: the server can report a stage twice. */
function heldProgress(held, next) {
    const heldFraction = loadFraction(held);
    if (!held || heldFraction === undefined) {
        return next;
    }
    const nextFraction = loadFraction(next);
    return nextFraction === undefined || nextFraction < heldFraction
        ? held
        : next;
}
/**
 * One router operation on one model. It owns its abort controller and its
 * promise, so withdrawing it and proving a late answer still belongs to it
 * are the same check.
 */
export class RouterRecord {
    constructor(kind, server, remoteModelId, now) {
        this.kind = kind;
        this.controller = new AbortController();
        this.phase = 'requested';
        /**
         * The read counter just before the request went out; only a read that
         * started later may settle this record. Infinite until then.
         */
        this.postedAfterSeq = Number.POSITIVE_INFINITY;
        this.verdictRequested = false;
        this.detail = undefined;
        this.failure = undefined;
        this.key = keyOf(server.id, remoteModelId);
        this.serverId = server.id;
        this.remoteModelId = remoteModelId;
        this.url = server.url;
        this.serverType = server.serverType;
        this.startedAt = now;
        this.lastEvidenceAt = now;
        this.done = new Promise(resolve => {
            this.settle = resolve;
        });
        makeObservable(this, {
            phase: observable,
            verdictRequested: observable,
            detail: observable.ref,
            failure: observable.ref,
        });
    }
}
/**
 * llama-server router mode: loads and unloads models, one operation per
 * model, on a server whose list says it is a router. Reads `ServerStore` and never writes
 * it; the list `ServerStore` fetches is the only verdict source.
 */
export class RouterStore {
    constructor() {
        this.records = observable.map({}, { deep: false });
        /** Whether a server's build has `/models/sse`; only a 404 says it has not. */
        this.streamCap = {};
        this.stream = null;
        this.pickerServerId = null;
        /**
         * Follows the app state, but only flips back to true together with the
         * foreground reads it starts, so the stream reopens after them.
         */
        this.foreground = true;
        this.foregroundReadsPending = 0;
        /** Wall time minus the time spent in the background this session. */
        this.clock = {
            backgroundedTotalMs: 0,
            backgroundedAt: undefined,
        };
        /** Servers whose stream ended on its own; polled, not reopened. */
        this.streamDropped = new Set();
        this.streamHandle = null;
        this.streamToken = 0;
        this.lastPollAt = new Map();
        this.ticker = null;
        this.reads = new Map();
        this.seenSeq = new Map();
        this.disposers = [];
        makeAutoObservable(this, {
            records: false,
            stream: observable.ref,
            foreground: observable,
            foregroundReadsPending: observable,
            clock: false,
            streamDropped: observable,
            streamHandle: false,
            streamToken: false,
            lastPollAt: false,
            ticker: false,
            reads: false,
            seenSeq: false,
            disposers: false,
        });
    }
    /**
     * At most one stream app-wide: to the server the picker shows, else to the
     * server of the most recent load or unload in flight. None while
     * backgrounded, and never to one whose stream is absent or has dropped.
     */
    get desiredStreamServer() {
        if (!this.foreground || this.foregroundReadsPending > 0) {
            return null;
        }
        const candidates = [];
        if (this.pickerServerId && this.isRouter(this.pickerServerId)) {
            candidates.push(this.pickerServerId);
        }
        const latest = this.allInFlight.at(-1);
        if (latest) {
            candidates.push(latest.serverId);
        }
        return (candidates.find(id => this.streamCap[id] !== 'absent' && !this.streamDropped.has(id)) ?? null);
    }
    get hasInFlight() {
        return this.allInFlight.length > 0;
    }
    get allInFlight() {
        return Array.from(this.records.values()).filter(record => this.owns(record));
    }
    /** Router evidence: the type can be one, and its list says it is one. */
    isRouter(serverId) {
        const server = serverStore.servers.find(s => s.id === serverId);
        if (!server || !profileFor(server.serverType).hasRouter) {
            return false;
        }
        const rows = serverStore.serverModels.get(serverId) ?? [];
        if (rows.length > 0) {
            return rows.some(hasRouterStatus);
        }
        return serverStore.listReads[serverId]?.hasModelsKey === false;
    }
    /** The list's word on one model; a stale or missing read claims nothing. */
    rowState(serverId, remoteModelId) {
        return rowStateFromList(serverStore.serverModels.get(serverId) ?? [], remoteModelId, serverStore.listReads[serverId]?.stale !== false);
    }
    recordFor(serverId, remoteModelId) {
        return this.records.get(keyOf(serverId, remoteModelId));
    }
    owns(record) {
        return (this.records.get(record.key) === record &&
            !record.controller.signal.aborted &&
            record.failure === undefined);
    }
    /**
     * The only issuer of a load. Resolves when the model is ready, the load
     * ended, the server turned out not to be a router, or the caller's signal
     * ended this caller's wait.
     */
    async ensureLoaded(serverId, remoteModelId, signal) {
        return (await this.acquire(serverId, remoteModelId, signal)).outcome;
    }
    /**
     * Readiness for the completion engine. A session whose url no longer
     * matches the server it was bound to stays on its own backend untouched.
     * With `reread`, a list read that starts now decides, not the cached one.
     * True only when this router made the model ready.
     */
    async ensureReady(binding, signal, options) {
        const server = serverStore.servers.find(s => s.id === binding.serverId);
        if (!server || server.url !== binding.url) {
            return false;
        }
        const { outcome, record } = await this.acquire(binding.serverId, binding.remoteModelId, signal, options?.reread === true);
        if (outcome === 'withdrawn') {
            throw new RemoteModelRequestWithdrawnError();
        }
        if (outcome === 'failed') {
            throw new RemoteModelNotReadyError(record?.failure?.cause ?? 'load-failed', record?.failure?.cause === 'load-failed' ? record.reason : undefined);
        }
        return outcome === 'ready';
    }
    unload(serverId, remoteModelId) {
        this.activate();
        const existing = this.recordFor(serverId, remoteModelId);
        if (existing && this.owns(existing)) {
            return;
        }
        const server = serverStore.servers.find(s => s.id === serverId);
        if (!server || !this.isRouter(serverId)) {
            return;
        }
        if (existing) {
            this.records.delete(existing.key);
        }
        this.issueUnload(this.start('unload', server, remoteModelId));
    }
    /** Ends an in-flight load and unloads whatever it may have started. */
    cancel(serverId, remoteModelId) {
        const record = this.recordFor(serverId, remoteModelId);
        if (!record || record.kind !== 'load' || !this.owns(record)) {
            return;
        }
        this.end(record, 'withdrawn');
        this.unload(serverId, remoteModelId);
    }
    /** The picker shows this server; a dropped stream there may reopen. */
    setPickerServer(serverId) {
        this.activate();
        this.pickerServerId = serverId;
        if (serverId) {
            this.streamDropped.delete(serverId);
        }
    }
    dismiss(serverId, remoteModelId) {
        const record = this.recordFor(serverId, remoteModelId);
        if (record?.failure) {
            this.records.delete(record.key);
        }
    }
    /** Tears down every reaction; the store is inert until its next call. */
    dispose() {
        for (const dispose of this.disposers) {
            dispose();
        }
        this.disposers = [];
        this.stopTicker();
        this.closeStream();
    }
    /** The foreground clock: frozen while backgrounded. */
    now() {
        const wall = Date.now();
        const { backgroundedTotalMs, backgroundedAt } = this.clock;
        return (wall -
            backgroundedTotalMs -
            (backgroundedAt === undefined ? 0 : wall - backgroundedAt));
    }
    inFlight(serverId) {
        return this.allInFlight.filter(record => record.serverId === serverId);
    }
    async acquire(serverId, remoteModelId, signal, reread = false) {
        this.activate();
        let listRead = false;
        for (;;) {
            const step = this.decide(serverId, remoteModelId, signal, listRead, reread);
            const fresh = reread && !listRead;
            listRead = true;
            if (step.kind === 'done') {
                return step.result;
            }
            const waited = step.kind === 'read'
                ? await untilAborted(fresh
                    ? this.requestRead(serverId)
                    : (this.reads.get(serverId)?.current ??
                        this.startRead(serverId)), signal)
                : (await step.unload).outcome;
            if (waited === 'stopped' || signal?.aborted) {
                return { outcome: 'stopped' };
            }
        }
    }
    /**
     * One synchronous pass: no await between finding the key free and claiming
     * it, so concurrent callers resuming here find the first one's record.
     */
    decide(serverId, remoteModelId, signal, listRead, reread) {
        const server = serverStore.servers.find(s => s.id === serverId);
        if (!server || !profileFor(server.serverType).hasRouter) {
            return { kind: 'done', result: { outcome: 'not-router' } };
        }
        if (!listRead && (reread || !serverStore.listReads[serverId])) {
            return { kind: 'read' };
        }
        if (!this.isRouter(serverId)) {
            return { kind: 'done', result: { outcome: 'not-router' } };
        }
        const existing = this.recordFor(serverId, remoteModelId);
        if (existing && this.owns(existing)) {
            return existing.kind === 'load'
                ? { kind: 'done', result: this.join(existing, signal) }
                : { kind: 'unload', unload: this.join(existing, signal) };
        }
        if (existing) {
            this.records.delete(existing.key);
        }
        const row = this.rowState(serverId, remoteModelId);
        if (row === 'loaded' || row === 'sleeping') {
            return { kind: 'done', result: { outcome: 'ready' } };
        }
        const record = this.start('load', server, remoteModelId);
        this.issueLoad(record);
        return { kind: 'done', result: this.join(record, signal) };
    }
    /** The record's outcome, or `stopped` if the caller's signal ends first. */
    async join(record, signal) {
        const result = await untilAborted(record.done.then(outcome => ({ outcome, record })), signal);
        return result === 'stopped' ? { outcome: 'stopped', record } : result;
    }
    start(kind, server, remoteModelId) {
        const record = new RouterRecord(kind, server, remoteModelId, this.now());
        this.records.set(record.key, record);
        this.streamDropped.delete(server.id);
        return record;
    }
    /**
     * The only exit. A failure is kept on the record so a surface can show it;
     * any other ending removes the record. Aborting last cancels whatever
     * request the record still has out.
     */
    end(record, outcome, failure) {
        if (!this.owns(record)) {
            return;
        }
        if (outcome === 'failed' && failure) {
            record.failure = failure;
        }
        else {
            this.records.delete(record.key);
        }
        record.settle(outcome);
        record.controller.abort();
    }
    corroborate(record) {
        record.phase = 'active';
        record.lastEvidenceAt = this.now();
        record.verdictRequested = false;
    }
    askList(record) {
        record.verdictRequested = true;
        record.lastEvidenceAt = this.now();
        this.requestRead(record.serverId);
    }
    async target(record) {
        const apiKey = await serverStore.getApiKey(record.serverId);
        const server = serverStore.servers.find(s => s.id === record.serverId);
        return { url: record.url, apiKey, timeoutMs: server?.requestTimeoutMs };
    }
    async issueLoad(record) {
        const target = await this.target(record);
        if (!this.owns(record)) {
            return;
        }
        record.postedAfterSeq = serverStore.readSeq;
        let status;
        let body;
        try {
            ({ status, body } = await postLoad(target, record.remoteModelId, record.controller.signal));
        }
        catch {
            runInAction(() => this.end(record, 'failed', unreachableFailure()));
            return;
        }
        runInAction(() => {
            if (!this.owns(record) || isSuccess(status)) {
                return;
            }
            record.reason = serverReason(body);
            const row = this.rowState(record.serverId, record.remoteModelId);
            if (row === 'loaded' || row === 'sleeping') {
                this.end(record, 'ready');
            }
            else if (row !== 'loading' && row !== 'downloading') {
                this.askList(record);
            }
        });
    }
    async issueUnload(record) {
        const target = await this.target(record);
        if (!this.owns(record)) {
            return;
        }
        record.postedAfterSeq = serverStore.readSeq;
        await postUnload(target, record.remoteModelId, record.controller.signal).catch(noop);
        if (this.owns(record)) {
            this.requestRead(record.serverId);
        }
    }
    /**
     * Every read this store asks for: at most one in flight per server, and a
     * request made during one runs once after it.
     */
    requestRead(serverId) {
        const slot = this.reads.get(serverId);
        if (!slot) {
            return this.startRead(serverId);
        }
        if (!slot.next) {
            slot.next = slot.current.then(() => this.reads.get(serverId)?.current ?? this.startRead(serverId));
        }
        return slot.next;
    }
    startRead(serverId) {
        const slot = {
            current: Promise.resolve(),
        };
        slot.current = serverStore
            .fetchModelsForServer(serverId)
            .then(noop, noop)
            .then(() => {
            if (this.reads.get(serverId) === slot) {
                this.reads.delete(serverId);
            }
        });
        this.reads.set(serverId, slot);
        return slot.current;
    }
    /** Runs once per successful read that installed a new sequence number. */
    onRead(serverId, seq) {
        const records = this.inFlight(serverId);
        if (!this.isRouter(serverId)) {
            for (const record of records) {
                this.end(record, 'not-router');
            }
            return;
        }
        const rows = serverStore.serverModels.get(serverId) ?? [];
        const now = this.now();
        for (const record of records) {
            record.lastReadOkAt = now;
            if (record.postedAfterSeq >= seq) {
                continue;
            }
            const row = this.rowState(serverId, record.remoteModelId);
            if (record.kind === 'unload') {
                if (unloadReleased(row)) {
                    this.end(record, 'ready');
                }
                continue;
            }
            switch (loadVerdict(row, record.phase, record.verdictRequested)) {
                case 'ready':
                    this.end(record, 'ready');
                    break;
                case 'corroborate':
                    this.corroborate(record);
                    break;
                case 'failed':
                    this.end(record, 'failed', loadFailure(record.reason, record.detail?.exitCode ??
                        rowExitCode(rows, record.remoteModelId)));
                    break;
            }
        }
    }
    /** A server removed, repointed or retyped: what this store held for it goes. */
    onServerChanged(serverId) {
        for (const record of Array.from(this.records.values())) {
            if (record.serverId !== serverId) {
                continue;
            }
            if (this.owns(record)) {
                this.end(record, 'withdrawn');
            }
            else {
                this.records.delete(record.key);
            }
        }
        this.seenSeq.delete(serverId);
        this.reads.delete(serverId);
        delete this.streamCap[serverId];
        this.streamDropped.delete(serverId);
        this.lastPollAt.delete(serverId);
        if (this.stream?.serverId === serverId) {
            this.closeStream();
        }
    }
    followStream(serverId) {
        if (this.stream?.serverId === serverId) {
            return;
        }
        this.closeStream();
        if (serverId) {
            this.openStream(serverId);
        }
    }
    closeStream() {
        const handle = this.streamHandle;
        this.streamToken++;
        this.streamHandle = null;
        this.stream = null;
        handle?.close();
    }
    async openStream(serverId) {
        const server = serverStore.servers.find(s => s.id === serverId);
        if (!server) {
            return;
        }
        const token = ++this.streamToken;
        const current = () => token === this.streamToken;
        this.stream = { serverId, state: 'connecting' };
        const apiKey = await serverStore.getApiKey(serverId);
        if (!current()) {
            return;
        }
        const handle = openRouterEvents({ url: server.url, apiKey, timeoutMs: server.requestTimeoutMs }, {
            onOpen: () => runInAction(() => {
                if (current()) {
                    this.streamCap[serverId] = 'present';
                    this.stream = { serverId, state: 'open' };
                }
            }),
            onEvent: payload => {
                if (current()) {
                    this.applyEvent(serverId, payload);
                }
            },
            onEnd: status => runInAction(() => {
                if (!current()) {
                    return;
                }
                this.streamToken++;
                this.streamHandle = null;
                this.stream = null;
                if (status === 404) {
                    this.streamCap[serverId] = 'absent';
                }
                this.streamDropped.add(serverId);
            }),
        });
        if (current()) {
            this.streamHandle = handle;
        }
    }
    /**
     * The only writer of a record's detail. An event corroborates or asks for
     * a read; it never ends a record.
     */
    applyEvent(serverId, payload) {
        const effect = reduceRouterEvent(payload);
        if (effect.kind === 'ignore') {
            return;
        }
        if (effect.kind === 'read') {
            this.requestRead(serverId);
            return;
        }
        const record = this.recordFor(serverId, effect.model);
        const inFlight = record !== undefined && this.owns(record);
        if (inFlight) {
            record.lastEventAt = this.now();
        }
        if (record?.kind === 'load' && inFlight) {
            if (effect.status === 'loading') {
                this.corroborate(record);
            }
            const loadEnded = effect.status === 'unloaded' || effect.exitCode !== undefined;
            const held = loadEnded ? undefined : record.detail?.progress;
            const progress = effect.progress && heldProgress(held, effect.progress);
            const exitCode = effect.exitCode ?? record.detail?.exitCode;
            if (progress || loadEnded) {
                record.detail = {
                    ...(progress && { progress }),
                    ...(exitCode !== undefined && { exitCode }),
                };
            }
        }
        if (effect.status !== undefined && effect.status !== 'loading') {
            this.requestRead(serverId);
        }
    }
    startTicker() {
        if (!this.ticker) {
            this.ticker = setInterval(() => this.tick(), ROUTER_TICK_MS);
        }
    }
    stopTicker() {
        if (this.ticker) {
            clearInterval(this.ticker);
            this.ticker = null;
        }
    }
    tick() {
        this.runPolls();
        this.runBounds();
    }
    /** A watchdog only asks the list; the list answers. */
    runBounds() {
        const now = this.now();
        for (const record of this.allInFlight) {
            const heardAt = Math.max(record.startedAt, record.lastReadOkAt ?? 0, record.lastEventAt ?? 0);
            if (now - heardAt >= ROUTER_UNREACHABLE_MS) {
                this.end(record, 'failed', unreachableFailure());
            }
            else if (record.kind === 'load') {
                this.boundLoad(record, now);
            }
            else if (now - record.startedAt >= ROUTER_UNLOAD_SETTLE_MS) {
                this.settleUnload(record);
            }
        }
    }
    boundLoad(record, now) {
        if (now - record.startedAt >= ROUTER_LOAD_MAX_MS) {
            this.end(record, 'failed', loadMaxFailure(this.postRequestRow(record), record.reason, record.detail?.exitCode));
            return;
        }
        const window = record.phase === 'requested' ? ROUTER_ACK_MS : ROUTER_EVIDENCE_MS;
        if (now - record.lastEvidenceAt >= window) {
            this.askList(record);
        }
    }
    settleUnload(record) {
        const row = this.postRequestRow(record);
        if (row === undefined) {
            if (!this.reads.has(record.serverId)) {
                this.requestRead(record.serverId);
            }
            return;
        }
        if (unloadReleased(row)) {
            this.end(record, 'ready');
        }
        else {
            this.end(record, 'failed', unloadSettleFailure(row));
        }
    }
    /** The row as of the latest read, if that read started after the request. */
    postRequestRow(record) {
        const read = serverStore.listReads[record.serverId];
        return read && read.seq > record.postedAfterSeq
            ? this.rowState(record.serverId, record.remoteModelId)
            : undefined;
    }
    /**
     * Backgrounded, the clock freezes and the ticker and stream stop; records
     * and their waiters stay. Back in the foreground, every server with work in
     * flight is read before the stream may reopen.
     */
    onAppActive(active) {
        var _a;
        const wall = Date.now();
        if (!active) {
            (_a = this.clock).backgroundedAt ?? (_a.backgroundedAt = wall);
            this.foreground = false;
            return;
        }
        if (this.clock.backgroundedAt !== undefined) {
            this.clock.backgroundedTotalMs += wall - this.clock.backgroundedAt;
            this.clock.backgroundedAt = undefined;
        }
        this.streamDropped.clear();
        const servers = new Set(this.allInFlight.map(record => record.serverId));
        this.foregroundReadsPending = servers.size;
        this.foreground = true;
        for (const serverId of servers) {
            this.requestRead(serverId).finally(() => runInAction(() => {
                this.foregroundReadsPending--;
            }));
        }
    }
    /** Servers with work in flight and no open stream are read on a timer. */
    runPolls() {
        const now = this.now();
        const servers = new Set(this.allInFlight.map(record => record.serverId));
        for (const serverId of servers) {
            if (this.stream?.serverId === serverId && this.stream.state === 'open') {
                this.lastPollAt.delete(serverId);
                continue;
            }
            const last = this.lastPollAt.get(serverId);
            if (last === undefined) {
                this.lastPollAt.set(serverId, now);
            }
            else if (now - last >= ROUTER_POLL_MS) {
                this.lastPollAt.set(serverId, now);
                this.requestRead(serverId);
            }
        }
    }
    activate() {
        if (this.disposers.length > 0) {
            return;
        }
        for (const [serverId, read] of Object.entries(serverStore.listReads)) {
            this.seenSeq.set(serverId, read.seq);
        }
        if (!serverStore.appActive) {
            this.onAppActive(false);
        }
        this.disposers.push(reaction(() => serverStore.appActive, active => this.onAppActive(active)), reaction(() => Object.entries(serverStore.listReads).map(([serverId, read]) => [serverId, read.seq]), reads => {
            for (const [serverId, seq] of reads) {
                if (this.seenSeq.get(serverId) !== seq) {
                    this.seenSeq.set(serverId, seq);
                    this.onRead(serverId, seq);
                }
            }
        }, { equals: comparer.structural }), reaction(() => serverStore.servers.map(({ id, url, serverType }) => [id, url, serverType]), (servers, previous) => {
            const now = new Map(servers.map(([id, ...rest]) => [id, rest]));
            for (const [id, ...before] of previous) {
                const after = now.get(id);
                if (!after || !comparer.structural(after, before)) {
                    this.onServerChanged(id);
                }
            }
        }, { equals: comparer.structural }), reaction(() => this.desiredStreamServer, serverId => this.followStream(serverId), { fireImmediately: true }), reaction(() => this.foreground && this.hasInFlight, run => (run ? this.startTicker() : this.stopTicker()), { fireImmediately: true }));
    }
}
export const routerStore = new RouterStore();
