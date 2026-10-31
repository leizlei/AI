/**
 * Name-keyed registry for talent UI renderers.
 *
 * Mirrors {@link TalentRegistry} on the UI side: each visual talent registers
 * a `TalentUI` that knows how to render its result and pending state.
 * Text-only talents (calculate, datetime) do not register a TalentUI —
 * TalentSurface renders nothing for them.
 */
export class TalentUIRegistry {
    constructor() {
        this.uis = new Map();
    }
    register(ui) {
        this.uis.set(ui.name, ui);
    }
    get(name) {
        return this.uis.get(name);
    }
    has(name) {
        return this.uis.has(name);
    }
    /** Test helper: clear all registered UIs. */
    reset() {
        this.uis.clear();
    }
}
export const talentUIRegistry = new TalentUIRegistry();
