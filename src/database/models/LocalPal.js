var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';
let LocalPal = (() => {
    var _a;
    let _classSuper = Model;
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _thumbnailUrl_decorators;
    let _thumbnailUrl_initializers = [];
    let _thumbnailUrl_extraInitializers = [];
    let _systemPrompt_decorators;
    let _systemPrompt_initializers = [];
    let _systemPrompt_extraInitializers = [];
    let _originalSystemPrompt_decorators;
    let _originalSystemPrompt_initializers = [];
    let _originalSystemPrompt_extraInitializers = [];
    let _isSystemPromptChanged_decorators;
    let _isSystemPromptChanged_initializers = [];
    let _isSystemPromptChanged_extraInitializers = [];
    let _useAIPrompt_decorators;
    let _useAIPrompt_initializers = [];
    let _useAIPrompt_extraInitializers = [];
    let _defaultModel_decorators;
    let _defaultModel_initializers = [];
    let _defaultModel_extraInitializers = [];
    let _promptGenerationModel_decorators;
    let _promptGenerationModel_initializers = [];
    let _promptGenerationModel_extraInitializers = [];
    let _generatingPrompt_decorators;
    let _generatingPrompt_initializers = [];
    let _generatingPrompt_extraInitializers = [];
    let _color_decorators;
    let _color_initializers = [];
    let _color_extraInitializers = [];
    let _capabilities_decorators;
    let _capabilities_initializers = [];
    let _capabilities_extraInitializers = [];
    let _parameters_decorators;
    let _parameters_initializers = [];
    let _parameters_extraInitializers = [];
    let _parameterSchema_decorators;
    let _parameterSchema_initializers = [];
    let _parameterSchema_extraInitializers = [];
    let _source_decorators;
    let _source_initializers = [];
    let _source_extraInitializers = [];
    let _palshubId_decorators;
    let _palshubId_initializers = [];
    let _palshubId_extraInitializers = [];
    let _creatorInfo_decorators;
    let _creatorInfo_initializers = [];
    let _creatorInfo_extraInitializers = [];
    let _categories_decorators;
    let _categories_initializers = [];
    let _categories_extraInitializers = [];
    let _tags_decorators;
    let _tags_initializers = [];
    let _tags_extraInitializers = [];
    let _rating_decorators;
    let _rating_initializers = [];
    let _rating_extraInitializers = [];
    let _reviewCount_decorators;
    let _reviewCount_initializers = [];
    let _reviewCount_extraInitializers = [];
    let _protectionLevel_decorators;
    let _protectionLevel_initializers = [];
    let _protectionLevel_extraInitializers = [];
    let _priceCents_decorators;
    let _priceCents_initializers = [];
    let _priceCents_extraInitializers = [];
    let _isOwned_decorators;
    let _isOwned_initializers = [];
    let _isOwned_extraInitializers = [];
    let _generationSettings_decorators;
    let _generationSettings_initializers = [];
    let _generationSettings_extraInitializers = [];
    let _pact_decorators;
    let _pact_initializers = [];
    let _pact_extraInitializers = [];
    let _greeting_decorators;
    let _greeting_initializers = [];
    let _greeting_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    return _a = class LocalPal extends _classSuper {
            // Helper methods to parse JSON fields
            get defaultModelObject() {
                try {
                    return this.defaultModel ? JSON.parse(this.defaultModel) : undefined;
                }
                catch {
                    return undefined;
                }
            }
            get promptGenerationModelObject() {
                try {
                    return this.promptGenerationModel
                        ? JSON.parse(this.promptGenerationModel)
                        : undefined;
                }
                catch {
                    return undefined;
                }
            }
            get colorArray() {
                try {
                    return this.color ? JSON.parse(this.color) : undefined;
                }
                catch {
                    return undefined;
                }
            }
            get capabilitiesObject() {
                try {
                    return JSON.parse(this.capabilities || '{}');
                }
                catch {
                    return {};
                }
            }
            get parametersObject() {
                try {
                    return JSON.parse(this.parameters || '{}');
                }
                catch {
                    return {};
                }
            }
            get parameterSchemaArray() {
                try {
                    return JSON.parse(this.parameterSchema || '[]');
                }
                catch {
                    return [];
                }
            }
            get creatorInfoObject() {
                try {
                    return this.creatorInfo ? JSON.parse(this.creatorInfo) : undefined;
                }
                catch {
                    return undefined;
                }
            }
            get categoriesArray() {
                try {
                    return JSON.parse(this.categories || '[]');
                }
                catch {
                    return [];
                }
            }
            get tagsArray() {
                try {
                    return JSON.parse(this.tags || '[]');
                }
                catch {
                    return [];
                }
            }
            get pactObject() {
                try {
                    return this.pact ? JSON.parse(this.pact) : undefined;
                }
                catch {
                    return undefined;
                }
            }
            get greetingObject() {
                try {
                    return this.greeting ? JSON.parse(this.greeting) : undefined;
                }
                catch {
                    return undefined;
                }
            }
            get generationSettingsObject() {
                try {
                    return this.generationSettings
                        ? JSON.parse(this.generationSettings)
                        : undefined;
                }
                catch {
                    return undefined;
                }
            }
            get completionSettingsObject() {
                try {
                    const settings = this.generationSettings
                        ? JSON.parse(this.generationSettings)
                        : undefined;
                    // Validate that the settings object contains completion parameters
                    if (settings && typeof settings === 'object') {
                        // Import defaultCompletionParams here to avoid circular dependency
                        const { defaultCompletionParams, } = require('../../utils/completionSettingsVersions');
                        // Merge with defaults to ensure all required fields are present
                        // This is especially important for PalsHub pals that may only have partial settings
                        const mergedSettings = {
                            ...defaultCompletionParams,
                            ...settings,
                        };
                        return mergedSettings;
                    }
                    return undefined;
                }
                catch (error) {
                    console.error('LocalPal: Error parsing completionSettings:', error);
                    return undefined;
                }
            }
            // Convert to Pal interface
            toPal() {
                return {
                    type: 'local',
                    id: this.id,
                    name: this.name || '',
                    description: this.description,
                    thumbnail_url: this.thumbnailUrl,
                    systemPrompt: this.systemPrompt || '',
                    originalSystemPrompt: this.originalSystemPrompt,
                    isSystemPromptChanged: this.isSystemPromptChanged || false,
                    useAIPrompt: this.useAIPrompt || false,
                    defaultModel: this.defaultModelObject,
                    promptGenerationModel: this.promptGenerationModelObject,
                    generatingPrompt: this.generatingPrompt,
                    color: this.colorArray,
                    capabilities: this.capabilitiesObject,
                    parameters: this.parametersObject,
                    parameterSchema: this.parameterSchemaArray,
                    source: this.source,
                    palshub_id: this.palshubId,
                    creator_info: this.creatorInfoObject,
                    categories: this.categoriesArray,
                    tags: this.tagsArray,
                    rating: this.rating,
                    review_count: this.reviewCount,
                    protection_level: this.protectionLevel,
                    price_cents: this.priceCents,
                    is_owned: this.isOwned,
                    rawPalshubGenerationSettings: this.generationSettingsObject,
                    completionSettings: this.completionSettingsObject,
                    pact: this.pactObject,
                    greeting: this.greetingObject,
                    created_at: this.createdAt.toISOString(),
                    updated_at: this.updatedAt.toISOString(),
                };
            }
            // Helper to safely stringify JSON fields
            static safeStringify(value) {
                if (value === null || value === undefined) {
                    return undefined; // Preserve null/undefined as undefined in database
                }
                try {
                    return JSON.stringify(value);
                }
                catch {
                    return '{}';
                }
            }
            static safeStringifyArray(value) {
                try {
                    return JSON.stringify(value || []);
                }
                catch {
                    return '[]';
                }
            }
            constructor() {
                super(...arguments);
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.description = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.thumbnailUrl = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _thumbnailUrl_initializers, void 0));
                this.systemPrompt = (__runInitializers(this, _thumbnailUrl_extraInitializers), __runInitializers(this, _systemPrompt_initializers, void 0));
                this.originalSystemPrompt = (__runInitializers(this, _systemPrompt_extraInitializers), __runInitializers(this, _originalSystemPrompt_initializers, void 0));
                this.isSystemPromptChanged = (__runInitializers(this, _originalSystemPrompt_extraInitializers), __runInitializers(this, _isSystemPromptChanged_initializers, void 0));
                this.useAIPrompt = (__runInitializers(this, _isSystemPromptChanged_extraInitializers), __runInitializers(this, _useAIPrompt_initializers, void 0));
                this.defaultModel = (__runInitializers(this, _useAIPrompt_extraInitializers), __runInitializers(this, _defaultModel_initializers, void 0)); // JSON stringified
                this.promptGenerationModel = (__runInitializers(this, _defaultModel_extraInitializers), __runInitializers(this, _promptGenerationModel_initializers, void 0)); // JSON stringified
                this.generatingPrompt = (__runInitializers(this, _promptGenerationModel_extraInitializers), __runInitializers(this, _generatingPrompt_initializers, void 0));
                this.color = (__runInitializers(this, _generatingPrompt_extraInitializers), __runInitializers(this, _color_initializers, void 0)); // JSON stringified [string, string]
                this.capabilities = (__runInitializers(this, _color_extraInitializers), __runInitializers(this, _capabilities_initializers, void 0)); // JSON stringified PalCapabilities
                this.parameters = (__runInitializers(this, _capabilities_extraInitializers), __runInitializers(this, _parameters_initializers, void 0)); // JSON stringified Record<string, any>
                this.parameterSchema = (__runInitializers(this, _parameters_extraInitializers), __runInitializers(this, _parameterSchema_initializers, void 0)); // JSON stringified ParameterDefinition[]
                this.source = (__runInitializers(this, _parameterSchema_extraInitializers), __runInitializers(this, _source_initializers, void 0)); // 'local' | 'palshub'
                this.palshubId = (__runInitializers(this, _source_extraInitializers), __runInitializers(this, _palshubId_initializers, void 0));
                this.creatorInfo = (__runInitializers(this, _palshubId_extraInitializers), __runInitializers(this, _creatorInfo_initializers, void 0)); // JSON stringified
                this.categories = (__runInitializers(this, _creatorInfo_extraInitializers), __runInitializers(this, _categories_initializers, void 0)); // JSON stringified string[]
                this.tags = (__runInitializers(this, _categories_extraInitializers), __runInitializers(this, _tags_initializers, void 0)); // JSON stringified string[]
                this.rating = (__runInitializers(this, _tags_extraInitializers), __runInitializers(this, _rating_initializers, void 0));
                this.reviewCount = (__runInitializers(this, _rating_extraInitializers), __runInitializers(this, _reviewCount_initializers, void 0));
                this.protectionLevel = (__runInitializers(this, _reviewCount_extraInitializers), __runInitializers(this, _protectionLevel_initializers, void 0));
                this.priceCents = (__runInitializers(this, _protectionLevel_extraInitializers), __runInitializers(this, _priceCents_initializers, void 0));
                this.isOwned = (__runInitializers(this, _priceCents_extraInitializers), __runInitializers(this, _isOwned_initializers, void 0));
                this.generationSettings = (__runInitializers(this, _isOwned_extraInitializers), __runInitializers(this, _generationSettings_initializers, void 0)); // JSON stringified
                this.pact = (__runInitializers(this, _generationSettings_extraInitializers), __runInitializers(this, _pact_initializers, void 0)); // JSON stringified { talents: TalentRef[] }
                this.greeting = (__runInitializers(this, _pact_extraInitializers), __runInitializers(this, _greeting_initializers, void 0)); // JSON stringified Pal['greeting']
                this.createdAt = (__runInitializers(this, _greeting_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
                this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
                __runInitializers(this, _updatedAt_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _name_decorators = [field('name')];
            _description_decorators = [field('description')];
            _thumbnailUrl_decorators = [field('thumbnail_url')];
            _systemPrompt_decorators = [field('system_prompt')];
            _originalSystemPrompt_decorators = [field('original_system_prompt')];
            _isSystemPromptChanged_decorators = [field('is_system_prompt_changed')];
            _useAIPrompt_decorators = [field('use_ai_prompt')];
            _defaultModel_decorators = [field('default_model')];
            _promptGenerationModel_decorators = [field('prompt_generation_model')];
            _generatingPrompt_decorators = [field('generating_prompt')];
            _color_decorators = [field('color')];
            _capabilities_decorators = [field('capabilities')];
            _parameters_decorators = [field('parameters')];
            _parameterSchema_decorators = [field('parameter_schema')];
            _source_decorators = [field('source')];
            _palshubId_decorators = [field('palshub_id')];
            _creatorInfo_decorators = [field('creator_info')];
            _categories_decorators = [field('categories')];
            _tags_decorators = [field('tags')];
            _rating_decorators = [field('rating')];
            _reviewCount_decorators = [field('review_count')];
            _protectionLevel_decorators = [field('protection_level')];
            _priceCents_decorators = [field('price_cents')];
            _isOwned_decorators = [field('is_owned')];
            _generationSettings_decorators = [field('generation_settings')];
            _pact_decorators = [field('pact')];
            _greeting_decorators = [field('greeting')];
            _createdAt_decorators = [readonly, date('created_at')];
            _updatedAt_decorators = [readonly, date('updated_at')];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _thumbnailUrl_decorators, { kind: "field", name: "thumbnailUrl", static: false, private: false, access: { has: obj => "thumbnailUrl" in obj, get: obj => obj.thumbnailUrl, set: (obj, value) => { obj.thumbnailUrl = value; } }, metadata: _metadata }, _thumbnailUrl_initializers, _thumbnailUrl_extraInitializers);
            __esDecorate(null, null, _systemPrompt_decorators, { kind: "field", name: "systemPrompt", static: false, private: false, access: { has: obj => "systemPrompt" in obj, get: obj => obj.systemPrompt, set: (obj, value) => { obj.systemPrompt = value; } }, metadata: _metadata }, _systemPrompt_initializers, _systemPrompt_extraInitializers);
            __esDecorate(null, null, _originalSystemPrompt_decorators, { kind: "field", name: "originalSystemPrompt", static: false, private: false, access: { has: obj => "originalSystemPrompt" in obj, get: obj => obj.originalSystemPrompt, set: (obj, value) => { obj.originalSystemPrompt = value; } }, metadata: _metadata }, _originalSystemPrompt_initializers, _originalSystemPrompt_extraInitializers);
            __esDecorate(null, null, _isSystemPromptChanged_decorators, { kind: "field", name: "isSystemPromptChanged", static: false, private: false, access: { has: obj => "isSystemPromptChanged" in obj, get: obj => obj.isSystemPromptChanged, set: (obj, value) => { obj.isSystemPromptChanged = value; } }, metadata: _metadata }, _isSystemPromptChanged_initializers, _isSystemPromptChanged_extraInitializers);
            __esDecorate(null, null, _useAIPrompt_decorators, { kind: "field", name: "useAIPrompt", static: false, private: false, access: { has: obj => "useAIPrompt" in obj, get: obj => obj.useAIPrompt, set: (obj, value) => { obj.useAIPrompt = value; } }, metadata: _metadata }, _useAIPrompt_initializers, _useAIPrompt_extraInitializers);
            __esDecorate(null, null, _defaultModel_decorators, { kind: "field", name: "defaultModel", static: false, private: false, access: { has: obj => "defaultModel" in obj, get: obj => obj.defaultModel, set: (obj, value) => { obj.defaultModel = value; } }, metadata: _metadata }, _defaultModel_initializers, _defaultModel_extraInitializers);
            __esDecorate(null, null, _promptGenerationModel_decorators, { kind: "field", name: "promptGenerationModel", static: false, private: false, access: { has: obj => "promptGenerationModel" in obj, get: obj => obj.promptGenerationModel, set: (obj, value) => { obj.promptGenerationModel = value; } }, metadata: _metadata }, _promptGenerationModel_initializers, _promptGenerationModel_extraInitializers);
            __esDecorate(null, null, _generatingPrompt_decorators, { kind: "field", name: "generatingPrompt", static: false, private: false, access: { has: obj => "generatingPrompt" in obj, get: obj => obj.generatingPrompt, set: (obj, value) => { obj.generatingPrompt = value; } }, metadata: _metadata }, _generatingPrompt_initializers, _generatingPrompt_extraInitializers);
            __esDecorate(null, null, _color_decorators, { kind: "field", name: "color", static: false, private: false, access: { has: obj => "color" in obj, get: obj => obj.color, set: (obj, value) => { obj.color = value; } }, metadata: _metadata }, _color_initializers, _color_extraInitializers);
            __esDecorate(null, null, _capabilities_decorators, { kind: "field", name: "capabilities", static: false, private: false, access: { has: obj => "capabilities" in obj, get: obj => obj.capabilities, set: (obj, value) => { obj.capabilities = value; } }, metadata: _metadata }, _capabilities_initializers, _capabilities_extraInitializers);
            __esDecorate(null, null, _parameters_decorators, { kind: "field", name: "parameters", static: false, private: false, access: { has: obj => "parameters" in obj, get: obj => obj.parameters, set: (obj, value) => { obj.parameters = value; } }, metadata: _metadata }, _parameters_initializers, _parameters_extraInitializers);
            __esDecorate(null, null, _parameterSchema_decorators, { kind: "field", name: "parameterSchema", static: false, private: false, access: { has: obj => "parameterSchema" in obj, get: obj => obj.parameterSchema, set: (obj, value) => { obj.parameterSchema = value; } }, metadata: _metadata }, _parameterSchema_initializers, _parameterSchema_extraInitializers);
            __esDecorate(null, null, _source_decorators, { kind: "field", name: "source", static: false, private: false, access: { has: obj => "source" in obj, get: obj => obj.source, set: (obj, value) => { obj.source = value; } }, metadata: _metadata }, _source_initializers, _source_extraInitializers);
            __esDecorate(null, null, _palshubId_decorators, { kind: "field", name: "palshubId", static: false, private: false, access: { has: obj => "palshubId" in obj, get: obj => obj.palshubId, set: (obj, value) => { obj.palshubId = value; } }, metadata: _metadata }, _palshubId_initializers, _palshubId_extraInitializers);
            __esDecorate(null, null, _creatorInfo_decorators, { kind: "field", name: "creatorInfo", static: false, private: false, access: { has: obj => "creatorInfo" in obj, get: obj => obj.creatorInfo, set: (obj, value) => { obj.creatorInfo = value; } }, metadata: _metadata }, _creatorInfo_initializers, _creatorInfo_extraInitializers);
            __esDecorate(null, null, _categories_decorators, { kind: "field", name: "categories", static: false, private: false, access: { has: obj => "categories" in obj, get: obj => obj.categories, set: (obj, value) => { obj.categories = value; } }, metadata: _metadata }, _categories_initializers, _categories_extraInitializers);
            __esDecorate(null, null, _tags_decorators, { kind: "field", name: "tags", static: false, private: false, access: { has: obj => "tags" in obj, get: obj => obj.tags, set: (obj, value) => { obj.tags = value; } }, metadata: _metadata }, _tags_initializers, _tags_extraInitializers);
            __esDecorate(null, null, _rating_decorators, { kind: "field", name: "rating", static: false, private: false, access: { has: obj => "rating" in obj, get: obj => obj.rating, set: (obj, value) => { obj.rating = value; } }, metadata: _metadata }, _rating_initializers, _rating_extraInitializers);
            __esDecorate(null, null, _reviewCount_decorators, { kind: "field", name: "reviewCount", static: false, private: false, access: { has: obj => "reviewCount" in obj, get: obj => obj.reviewCount, set: (obj, value) => { obj.reviewCount = value; } }, metadata: _metadata }, _reviewCount_initializers, _reviewCount_extraInitializers);
            __esDecorate(null, null, _protectionLevel_decorators, { kind: "field", name: "protectionLevel", static: false, private: false, access: { has: obj => "protectionLevel" in obj, get: obj => obj.protectionLevel, set: (obj, value) => { obj.protectionLevel = value; } }, metadata: _metadata }, _protectionLevel_initializers, _protectionLevel_extraInitializers);
            __esDecorate(null, null, _priceCents_decorators, { kind: "field", name: "priceCents", static: false, private: false, access: { has: obj => "priceCents" in obj, get: obj => obj.priceCents, set: (obj, value) => { obj.priceCents = value; } }, metadata: _metadata }, _priceCents_initializers, _priceCents_extraInitializers);
            __esDecorate(null, null, _isOwned_decorators, { kind: "field", name: "isOwned", static: false, private: false, access: { has: obj => "isOwned" in obj, get: obj => obj.isOwned, set: (obj, value) => { obj.isOwned = value; } }, metadata: _metadata }, _isOwned_initializers, _isOwned_extraInitializers);
            __esDecorate(null, null, _generationSettings_decorators, { kind: "field", name: "generationSettings", static: false, private: false, access: { has: obj => "generationSettings" in obj, get: obj => obj.generationSettings, set: (obj, value) => { obj.generationSettings = value; } }, metadata: _metadata }, _generationSettings_initializers, _generationSettings_extraInitializers);
            __esDecorate(null, null, _pact_decorators, { kind: "field", name: "pact", static: false, private: false, access: { has: obj => "pact" in obj, get: obj => obj.pact, set: (obj, value) => { obj.pact = value; } }, metadata: _metadata }, _pact_initializers, _pact_extraInitializers);
            __esDecorate(null, null, _greeting_decorators, { kind: "field", name: "greeting", static: false, private: false, access: { has: obj => "greeting" in obj, get: obj => obj.greeting, set: (obj, value) => { obj.greeting = value; } }, metadata: _metadata }, _greeting_initializers, _greeting_extraInitializers);
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a.table = 'local_pals',
        _a;
})();
export default LocalPal;
