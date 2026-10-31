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
let CachedPal = (() => {
    var _a;
    let _classSuper = Model;
    let _palshubId_decorators;
    let _palshubId_initializers = [];
    let _palshubId_extraInitializers = [];
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _thumbnailUrl_decorators;
    let _thumbnailUrl_initializers = [];
    let _thumbnailUrl_extraInitializers = [];
    let _creatorId_decorators;
    let _creatorId_initializers = [];
    let _creatorId_extraInitializers = [];
    let _creatorName_decorators;
    let _creatorName_initializers = [];
    let _creatorName_extraInitializers = [];
    let _creatorAvatarUrl_decorators;
    let _creatorAvatarUrl_initializers = [];
    let _creatorAvatarUrl_extraInitializers = [];
    let _protectionLevel_decorators;
    let _protectionLevel_initializers = [];
    let _protectionLevel_extraInitializers = [];
    let _priceCents_decorators;
    let _priceCents_initializers = [];
    let _priceCents_extraInitializers = [];
    let _allowFork_decorators;
    let _allowFork_initializers = [];
    let _allowFork_extraInitializers = [];
    let _averageRating_decorators;
    let _averageRating_initializers = [];
    let _averageRating_extraInitializers = [];
    let _reviewCount_decorators;
    let _reviewCount_initializers = [];
    let _reviewCount_extraInitializers = [];
    let _isOwned_decorators;
    let _isOwned_initializers = [];
    let _isOwned_extraInitializers = [];
    let _categories_decorators;
    let _categories_initializers = [];
    let _categories_extraInitializers = [];
    let _tags_decorators;
    let _tags_initializers = [];
    let _tags_extraInitializers = [];
    let _systemPrompt_decorators;
    let _systemPrompt_initializers = [];
    let _systemPrompt_extraInitializers = [];
    let _modelSettings_decorators;
    let _modelSettings_initializers = [];
    let _modelSettings_extraInitializers = [];
    let _cachedAt_decorators;
    let _cachedAt_initializers = [];
    let _cachedAt_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    return _a = class CachedPal extends _classSuper {
            // Helper methods to parse JSON fields
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
            get modelSettingsObject() {
                try {
                    return JSON.parse(this.modelSettings || '{}');
                }
                catch {
                    return {};
                }
            }
            get creatorInfo() {
                return {
                    id: this.creatorId,
                    name: this.creatorName,
                    avatar_url: this.creatorAvatarUrl,
                };
            }
            constructor() {
                super(...arguments);
                this.palshubId = __runInitializers(this, _palshubId_initializers, void 0);
                this.title = (__runInitializers(this, _palshubId_extraInitializers), __runInitializers(this, _title_initializers, void 0));
                this.description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.thumbnailUrl = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _thumbnailUrl_initializers, void 0));
                this.creatorId = (__runInitializers(this, _thumbnailUrl_extraInitializers), __runInitializers(this, _creatorId_initializers, void 0));
                this.creatorName = (__runInitializers(this, _creatorId_extraInitializers), __runInitializers(this, _creatorName_initializers, void 0));
                this.creatorAvatarUrl = (__runInitializers(this, _creatorName_extraInitializers), __runInitializers(this, _creatorAvatarUrl_initializers, void 0));
                this.protectionLevel = (__runInitializers(this, _creatorAvatarUrl_extraInitializers), __runInitializers(this, _protectionLevel_initializers, void 0));
                this.priceCents = (__runInitializers(this, _protectionLevel_extraInitializers), __runInitializers(this, _priceCents_initializers, void 0));
                this.allowFork = (__runInitializers(this, _priceCents_extraInitializers), __runInitializers(this, _allowFork_initializers, void 0));
                this.averageRating = (__runInitializers(this, _allowFork_extraInitializers), __runInitializers(this, _averageRating_initializers, void 0));
                this.reviewCount = (__runInitializers(this, _averageRating_extraInitializers), __runInitializers(this, _reviewCount_initializers, void 0));
                this.isOwned = (__runInitializers(this, _reviewCount_extraInitializers), __runInitializers(this, _isOwned_initializers, void 0));
                this.categories = (__runInitializers(this, _isOwned_extraInitializers), __runInitializers(this, _categories_initializers, void 0)); // JSON array
                this.tags = (__runInitializers(this, _categories_extraInitializers), __runInitializers(this, _tags_initializers, void 0)); // JSON array
                this.systemPrompt = (__runInitializers(this, _tags_extraInitializers), __runInitializers(this, _systemPrompt_initializers, void 0));
                this.modelSettings = (__runInitializers(this, _systemPrompt_extraInitializers), __runInitializers(this, _modelSettings_initializers, void 0)); // JSON object
                this.cachedAt = (__runInitializers(this, _modelSettings_extraInitializers), __runInitializers(this, _cachedAt_initializers, void 0));
                this.createdAt = (__runInitializers(this, _cachedAt_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
                this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
                __runInitializers(this, _updatedAt_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _palshubId_decorators = [field('palshub_id')];
            _title_decorators = [field('title')];
            _description_decorators = [field('description')];
            _thumbnailUrl_decorators = [field('thumbnail_url')];
            _creatorId_decorators = [field('creator_id')];
            _creatorName_decorators = [field('creator_name')];
            _creatorAvatarUrl_decorators = [field('creator_avatar_url')];
            _protectionLevel_decorators = [field('protection_level')];
            _priceCents_decorators = [field('price_cents')];
            _allowFork_decorators = [field('allow_fork')];
            _averageRating_decorators = [field('average_rating')];
            _reviewCount_decorators = [field('review_count')];
            _isOwned_decorators = [field('is_owned')];
            _categories_decorators = [field('categories')];
            _tags_decorators = [field('tags')];
            _systemPrompt_decorators = [field('system_prompt')];
            _modelSettings_decorators = [field('model_settings')];
            _cachedAt_decorators = [field('cached_at')];
            _createdAt_decorators = [readonly, date('created_at')];
            _updatedAt_decorators = [readonly, date('updated_at')];
            __esDecorate(null, null, _palshubId_decorators, { kind: "field", name: "palshubId", static: false, private: false, access: { has: obj => "palshubId" in obj, get: obj => obj.palshubId, set: (obj, value) => { obj.palshubId = value; } }, metadata: _metadata }, _palshubId_initializers, _palshubId_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _thumbnailUrl_decorators, { kind: "field", name: "thumbnailUrl", static: false, private: false, access: { has: obj => "thumbnailUrl" in obj, get: obj => obj.thumbnailUrl, set: (obj, value) => { obj.thumbnailUrl = value; } }, metadata: _metadata }, _thumbnailUrl_initializers, _thumbnailUrl_extraInitializers);
            __esDecorate(null, null, _creatorId_decorators, { kind: "field", name: "creatorId", static: false, private: false, access: { has: obj => "creatorId" in obj, get: obj => obj.creatorId, set: (obj, value) => { obj.creatorId = value; } }, metadata: _metadata }, _creatorId_initializers, _creatorId_extraInitializers);
            __esDecorate(null, null, _creatorName_decorators, { kind: "field", name: "creatorName", static: false, private: false, access: { has: obj => "creatorName" in obj, get: obj => obj.creatorName, set: (obj, value) => { obj.creatorName = value; } }, metadata: _metadata }, _creatorName_initializers, _creatorName_extraInitializers);
            __esDecorate(null, null, _creatorAvatarUrl_decorators, { kind: "field", name: "creatorAvatarUrl", static: false, private: false, access: { has: obj => "creatorAvatarUrl" in obj, get: obj => obj.creatorAvatarUrl, set: (obj, value) => { obj.creatorAvatarUrl = value; } }, metadata: _metadata }, _creatorAvatarUrl_initializers, _creatorAvatarUrl_extraInitializers);
            __esDecorate(null, null, _protectionLevel_decorators, { kind: "field", name: "protectionLevel", static: false, private: false, access: { has: obj => "protectionLevel" in obj, get: obj => obj.protectionLevel, set: (obj, value) => { obj.protectionLevel = value; } }, metadata: _metadata }, _protectionLevel_initializers, _protectionLevel_extraInitializers);
            __esDecorate(null, null, _priceCents_decorators, { kind: "field", name: "priceCents", static: false, private: false, access: { has: obj => "priceCents" in obj, get: obj => obj.priceCents, set: (obj, value) => { obj.priceCents = value; } }, metadata: _metadata }, _priceCents_initializers, _priceCents_extraInitializers);
            __esDecorate(null, null, _allowFork_decorators, { kind: "field", name: "allowFork", static: false, private: false, access: { has: obj => "allowFork" in obj, get: obj => obj.allowFork, set: (obj, value) => { obj.allowFork = value; } }, metadata: _metadata }, _allowFork_initializers, _allowFork_extraInitializers);
            __esDecorate(null, null, _averageRating_decorators, { kind: "field", name: "averageRating", static: false, private: false, access: { has: obj => "averageRating" in obj, get: obj => obj.averageRating, set: (obj, value) => { obj.averageRating = value; } }, metadata: _metadata }, _averageRating_initializers, _averageRating_extraInitializers);
            __esDecorate(null, null, _reviewCount_decorators, { kind: "field", name: "reviewCount", static: false, private: false, access: { has: obj => "reviewCount" in obj, get: obj => obj.reviewCount, set: (obj, value) => { obj.reviewCount = value; } }, metadata: _metadata }, _reviewCount_initializers, _reviewCount_extraInitializers);
            __esDecorate(null, null, _isOwned_decorators, { kind: "field", name: "isOwned", static: false, private: false, access: { has: obj => "isOwned" in obj, get: obj => obj.isOwned, set: (obj, value) => { obj.isOwned = value; } }, metadata: _metadata }, _isOwned_initializers, _isOwned_extraInitializers);
            __esDecorate(null, null, _categories_decorators, { kind: "field", name: "categories", static: false, private: false, access: { has: obj => "categories" in obj, get: obj => obj.categories, set: (obj, value) => { obj.categories = value; } }, metadata: _metadata }, _categories_initializers, _categories_extraInitializers);
            __esDecorate(null, null, _tags_decorators, { kind: "field", name: "tags", static: false, private: false, access: { has: obj => "tags" in obj, get: obj => obj.tags, set: (obj, value) => { obj.tags = value; } }, metadata: _metadata }, _tags_initializers, _tags_extraInitializers);
            __esDecorate(null, null, _systemPrompt_decorators, { kind: "field", name: "systemPrompt", static: false, private: false, access: { has: obj => "systemPrompt" in obj, get: obj => obj.systemPrompt, set: (obj, value) => { obj.systemPrompt = value; } }, metadata: _metadata }, _systemPrompt_initializers, _systemPrompt_extraInitializers);
            __esDecorate(null, null, _modelSettings_decorators, { kind: "field", name: "modelSettings", static: false, private: false, access: { has: obj => "modelSettings" in obj, get: obj => obj.modelSettings, set: (obj, value) => { obj.modelSettings = value; } }, metadata: _metadata }, _modelSettings_initializers, _modelSettings_extraInitializers);
            __esDecorate(null, null, _cachedAt_decorators, { kind: "field", name: "cachedAt", static: false, private: false, access: { has: obj => "cachedAt" in obj, get: obj => obj.cachedAt, set: (obj, value) => { obj.cachedAt = value; } }, metadata: _metadata }, _cachedAt_initializers, _cachedAt_extraInitializers);
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a.table = 'cached_pals',
        _a;
})();
export default CachedPal;
