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
import { migrateCompletionSettings } from '../../utils/completionSettingsVersions';
let CompletionSetting = (() => {
    var _a;
    let _classSuper = Model;
    let _sessionId_decorators;
    let _sessionId_initializers = [];
    let _sessionId_extraInitializers = [];
    let _settings_decorators;
    let _settings_initializers = [];
    let _settings_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    return _a = class CompletionSetting extends _classSuper {
            // Helper methods
            getSettings() {
                try {
                    const parsedSettings = JSON.parse(this.settings);
                    // Check if completion settings need migration
                    const migratedSettings = migrateCompletionSettings(parsedSettings);
                    if (migratedSettings.version !== parsedSettings.version) {
                        console.log(`Migrated completion settings from version ${parsedSettings.version} to ${migratedSettings.version} for session ${this.sessionId}`);
                        console.log('Settings need to be saved by the repository with a proper database.write() call');
                    }
                    return migratedSettings;
                }
                catch (error) {
                    console.error('Error parsing completion settings:', error);
                    // Return default settings if parsing fails
                    return migrateCompletionSettings({});
                }
            }
            setSettings(settings) {
                // Ensure the version is set
                if (settings.version === undefined) {
                    settings = migrateCompletionSettings(settings);
                }
                return this.update(record => {
                    record.settings = JSON.stringify(settings);
                });
            }
            constructor() {
                super(...arguments);
                this.sessionId = __runInitializers(this, _sessionId_initializers, void 0);
                this.settings = (__runInitializers(this, _sessionId_extraInitializers), __runInitializers(this, _settings_initializers, void 0));
                this.createdAt = (__runInitializers(this, _settings_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
                this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
                __runInitializers(this, _updatedAt_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _sessionId_decorators = [text('session_id')];
            _settings_decorators = [text('settings')];
            _createdAt_decorators = [field('created_at')];
            _updatedAt_decorators = [field('updated_at')];
            __esDecorate(null, null, _sessionId_decorators, { kind: "field", name: "sessionId", static: false, private: false, access: { has: obj => "sessionId" in obj, get: obj => obj.sessionId, set: (obj, value) => { obj.sessionId = value; } }, metadata: _metadata }, _sessionId_initializers, _sessionId_extraInitializers);
            __esDecorate(null, null, _settings_decorators, { kind: "field", name: "settings", static: false, private: false, access: { has: obj => "settings" in obj, get: obj => obj.settings, set: (obj, value) => { obj.settings = value; } }, metadata: _metadata }, _settings_initializers, _settings_extraInitializers);
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a.table = 'completion_settings',
        _a.associations = {
            chat_sessions: { type: 'belongs_to', key: 'session_id' },
        },
        _a;
})();
export default CompletionSetting;
