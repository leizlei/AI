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
import { field, text } from '@nozbe/watermelondb/decorators';
let ChatSession = (() => {
    var _a;
    let _classSuper = Model;
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _date_decorators;
    let _date_initializers = [];
    let _date_extraInitializers = [];
    let _activePalId_decorators;
    let _activePalId_initializers = [];
    let _activePalId_extraInitializers = [];
    let _settingsSource_decorators;
    let _settingsSource_initializers = [];
    let _settingsSource_extraInitializers = [];
    let _pinned_decorators;
    let _pinned_initializers = [];
    let _pinned_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    return _a = class ChatSession extends _classSuper {
            constructor() {
                super(...arguments);
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.date = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _date_initializers, void 0));
                this.activePalId = (__runInitializers(this, _date_extraInitializers), __runInitializers(this, _activePalId_initializers, void 0));
                this.settingsSource = (__runInitializers(this, _activePalId_extraInitializers), __runInitializers(this, _settingsSource_initializers, void 0));
                this.pinned = (__runInitializers(this, _settingsSource_extraInitializers), __runInitializers(this, _pinned_initializers, void 0));
                this.createdAt = (__runInitializers(this, _pinned_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
                this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
                __runInitializers(this, _updatedAt_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _title_decorators = [text('title')];
            _date_decorators = [text('date')];
            _activePalId_decorators = [text('active_pal_id')];
            _settingsSource_decorators = [text('settings_source')];
            _pinned_decorators = [field('pinned')];
            _createdAt_decorators = [field('created_at')];
            _updatedAt_decorators = [field('updated_at')];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _date_decorators, { kind: "field", name: "date", static: false, private: false, access: { has: obj => "date" in obj, get: obj => obj.date, set: (obj, value) => { obj.date = value; } }, metadata: _metadata }, _date_initializers, _date_extraInitializers);
            __esDecorate(null, null, _activePalId_decorators, { kind: "field", name: "activePalId", static: false, private: false, access: { has: obj => "activePalId" in obj, get: obj => obj.activePalId, set: (obj, value) => { obj.activePalId = value; } }, metadata: _metadata }, _activePalId_initializers, _activePalId_extraInitializers);
            __esDecorate(null, null, _settingsSource_decorators, { kind: "field", name: "settingsSource", static: false, private: false, access: { has: obj => "settingsSource" in obj, get: obj => obj.settingsSource, set: (obj, value) => { obj.settingsSource = value; } }, metadata: _metadata }, _settingsSource_initializers, _settingsSource_extraInitializers);
            __esDecorate(null, null, _pinned_decorators, { kind: "field", name: "pinned", static: false, private: false, access: { has: obj => "pinned" in obj, get: obj => obj.pinned, set: (obj, value) => { obj.pinned = value; } }, metadata: _metadata }, _pinned_initializers, _pinned_extraInitializers);
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a.table = 'chat_sessions',
        _a.associations = {
            messages: { type: 'has_many', foreignKey: 'session_id' },
            // WatermelonDB doesn't have a 'has_one' type in its TypeScript definitions
            // Use 'has_many' instead and handle it as a single item in the code
            completion_settings: { type: 'has_many', foreignKey: 'session_id' },
        },
        _a;
})();
export default ChatSession;
