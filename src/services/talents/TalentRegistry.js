/**
 * Name-keyed registry for talent engines.
 *
 * Any Pal that declares a talent in its `pact.talents` can invoke an engine
 * registered under that name. There is NO Pal-id coupling: engines are generic
 * across Pals, and a Pal opts in by naming the talent.
 */
export class TalentRegistry {
    constructor() {
        this.engines = new Map();
    }
    register(engine) {
        this.engines.set(engine.name, engine);
    }
    get(name) {
        return this.engines.get(name);
    }
    has(name) {
        return this.engines.has(name);
    }
    /** Return all registered engines. */
    getAll() {
        return Array.from(this.engines.values());
    }
    /** Test helper: clear all registered engines. */
    reset() {
        this.engines.clear();
    }
}
export const talentRegistry = new TalentRegistry();
