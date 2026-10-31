class Lease {
    constructor(engine, onEnd) {
        this.engine = engine;
        this.onEnd = onEnd;
        this.controller = new AbortController();
        this.ended = false;
    }
    get signal() {
        return this.controller.signal;
    }
    abort() {
        this.controller.abort();
    }
    end() {
        if (this.ended) {
            return;
        }
        this.ended = true;
        this.onEnd(this);
    }
}
/**
 * Holds at most one lease. Waiting acquirers are served in arrival order,
 * each only after the previous lease has ended.
 */
export class GenerationSlot {
    constructor() {
        this.active = null;
        this.activeEnded = Promise.resolve();
        this.turnsEnded = Promise.resolve();
        this.queuedAcquirers = 0;
    }
    get isBusy() {
        return this.active !== null || this.queuedAcquirers > 0;
    }
    /**
     * Resolves once every earlier acquirer has had its turn and `beforeGrant`
     * has settled; then grants a lease on `grantEngine()`, or resolves null
     * when that returns null.
     */
    async acquire(beforeGrant, grantEngine) {
        this.queuedAcquirers += 1;
        const previousTurnEnded = this.turnsEnded;
        let endTurn;
        this.turnsEnded = new Promise(resolve => {
            endTurn = resolve;
        });
        try {
            await previousTurnEnded;
            await beforeGrant().catch(() => { });
        }
        finally {
            this.queuedAcquirers -= 1;
        }
        const engine = grantEngine();
        if (!engine) {
            endTurn();
            return null;
        }
        return this.grant(engine, endTurn);
    }
    /** Grants at once, or returns null while a lease is held or acquirers wait. */
    tryAcquire(grantEngine) {
        if (this.isBusy) {
            return null;
        }
        const engine = grantEngine();
        if (!engine) {
            return null;
        }
        let endTurn;
        this.turnsEnded = new Promise(resolve => {
            endTurn = resolve;
        });
        return this.grant(engine, endTurn);
    }
    /** Aborts the held lease, if any; resolves when it has ended. */
    abortActive() {
        this.active?.abort();
        return this.activeEnded;
    }
    grant(engine, endTurn) {
        let markEnded;
        this.activeEnded = new Promise(resolve => {
            markEnded = resolve;
        });
        const lease = new Lease(engine, ended => {
            if (this.active === ended) {
                this.active = null;
            }
            markEnded();
            endTurn();
        });
        this.active = lease;
        return lease;
    }
}
