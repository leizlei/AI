import { RenderHtmlEngine } from './RenderHtmlEngine';
import { CalculateEngine } from './CalculateEngine';
import { DatetimeEngine } from './DatetimeEngine';
import { WebSearchEngine } from './WebSearchEngine';
import { ReadUrlEngine } from './ReadUrlEngine';
import { DocumentRetrievalEngine } from './DocumentRetrievalEngine';
import { talentRegistry } from './TalentRegistry';
import { searchProviderStore } from '../../store/SearchProviderStore';
import { documentStore } from '../documents/documentStore';
import { createSearchProvider, readWithDefaultReader } from '../search';
export { TalentRegistry, talentRegistry } from './TalentRegistry';
export { TalentUIRegistry, talentUIRegistry } from './TalentUIRegistry';
export { RenderHtmlEngine } from './RenderHtmlEngine';
export { CalculateEngine } from './CalculateEngine';
export { DatetimeEngine } from './DatetimeEngine';
export { WebSearchEngine } from './WebSearchEngine';
export { ReadUrlEngine } from './ReadUrlEngine';
export { DocumentRetrievalEngine } from './DocumentRetrievalEngine';
// Deliberately narrow: the raw allowlist writers stay module-internal so all
// writes happen inside services/talents (seed at run start, WebSearchEngine
// per search, ReadUrlEngine per page read).
export { seedReadUrlAllowlist, isReadUrlAllowed } from './readUrlAllowlist';
/**
 * The single place that imports the store, so the search engines stay
 * store-free and pure.
 */
function createSearchAccess() {
    return {
        getActiveProvider: () => {
            const id = searchProviderStore.activeProviderId;
            return createSearchProvider(id, () => searchProviderStore.getKey(id), () => searchProviderStore.getSearxngBaseUrl());
        },
        canSearch: () => searchProviderStore.canSearch,
        getResultCount: () => searchProviderStore.resultCount,
        readWithDefaultReader,
    };
}
let registered = false;
/**
 * Register built-in talent engines. UI renderers register separately via
 * `registerDefaultTalentUIs` — keeps the talent UI out of this service module's
 * graph so engine-logic consumers don't load the bottom-sheet tree.
 */
export function registerDefaultTalents() {
    if (registered) {
        return;
    }
    talentRegistry.register(new RenderHtmlEngine());
    talentRegistry.register(new CalculateEngine());
    talentRegistry.register(new DatetimeEngine());
    const searchAccess = createSearchAccess();
    talentRegistry.register(new WebSearchEngine(searchAccess));
    talentRegistry.register(new ReadUrlEngine(searchAccess));
    talentRegistry.register(new DocumentRetrievalEngine(documentStore));
    registered = true;
}
/**
 * Derive OpenAI-format tool schemas from registered engines.
 *
 * When `talentNames` is provided, only engines matching those names are
 * included — this ensures a Pal's completionSettings.tools matches its
 * pact.talents (the single source of truth for what the Pal advertises
 * to the model and what the dispatch loop will accept).
 *
 * Calls registerDefaultTalents() internally (idempotent).
 */
export function deriveToolSchemas(talentNames) {
    registerDefaultTalents();
    const engines = talentRegistry.getAll();
    if (!talentNames) {
        return engines.map(engine => engine.toToolDefinition());
    }
    const wanted = new Set(talentNames);
    return engines
        .filter(engine => wanted.has(engine.name))
        .map(engine => engine.toToolDefinition());
}
/**
 * Fragments are folded into the single leading system message by
 * `assembleMessages`; a talent never emits its own system message.
 */
export function collectSystemPromptFragments(talentNames, ctx) {
    registerDefaultTalents();
    const wanted = new Set(talentNames);
    const engineCtx = { ...ctx, activeTalents: wanted };
    return talentRegistry
        .getAll()
        .filter(engine => wanted.has(engine.name))
        .map(engine => engine.systemPromptFragment?.(engineCtx))
        .filter((fragment) => !!fragment && !!fragment.trim());
}
/**
 * Test helper: reset the `registered` guard so `registerDefaultTalents()` will
 * re-register engines after a `talentRegistry.reset()` call in test teardown.
 */
export function resetRegisteredFlag() {
    registered = false;
}
