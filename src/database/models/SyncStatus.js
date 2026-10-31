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
let SyncStatus = (() => {
    var _a;
    let _classSuper = Model;
    let _entityType_decorators;
    let _entityType_initializers = [];
    let _entityType_extraInitializers = [];
    let _entityId_decorators;
    let _entityId_initializers = [];
    let _entityId_extraInitializers = [];
    let _lastSync_decorators;
    let _lastSync_initializers = [];
    let _lastSync_extraInitializers = [];
    let _syncVersion_decorators;
    let _syncVersion_initializers = [];
    let _syncVersion_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _errorMessage_decorators;
    let _errorMessage_initializers = [];
    let _errorMessage_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    return _a = class SyncStatus extends _classSuper {
            get lastSyncDate() {
                return new Date(this.lastSync);
            }
            get isStale() {
                const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
                return this.lastSync < fiveMinutesAgo;
            }
            get hasError() {
                return this.status === 'error';
            }
            get isPending() {
                return this.status === 'pending';
            }
            get isSynced() {
                return this.status === 'synced';
            }
            constructor() {
                super(...arguments);
                this.entityType = __runInitializers(this, _entityType_initializers, void 0);
                this.entityId = (__runInitializers(this, _entityType_extraInitializers), __runInitializers(this, _entityId_initializers, void 0));
                this.lastSync = (__runInitializers(this, _entityId_extraInitializers), __runInitializers(this, _lastSync_initializers, void 0));
                this.syncVersion = (__runInitializers(this, _lastSync_extraInitializers), __runInitializers(this, _syncVersion_initializers, void 0));
                this.status = (__runInitializers(this, _syncVersion_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.errorMessage = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _errorMessage_initializers, void 0));
                this.createdAt = (__runInitializers(this, _errorMessage_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
                this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
                __runInitializers(this, _updatedAt_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _entityType_decorators = [field('entity_type')];
            _entityId_decorators = [field('entity_id')];
            _lastSync_decorators = [field('last_sync')];
            _syncVersion_decorators = [field('sync_version')];
            _status_decorators = [field('status')];
            _errorMessage_decorators = [field('error_message')];
            _createdAt_decorators = [readonly, date('created_at')];
            _updatedAt_decorators = [readonly, date('updated_at')];
            __esDecorate(null, null, _entityType_decorators, { kind: "field", name: "entityType", static: false, private: false, access: { has: obj => "entityType" in obj, get: obj => obj.entityType, set: (obj, value) => { obj.entityType = value; } }, metadata: _metadata }, _entityType_initializers, _entityType_extraInitializers);
            __esDecorate(null, null, _entityId_decorators, { kind: "field", name: "entityId", static: false, private: false, access: { has: obj => "entityId" in obj, get: obj => obj.entityId, set: (obj, value) => { obj.entityId = value; } }, metadata: _metadata }, _entityId_initializers, _entityId_extraInitializers);
            __esDecorate(null, null, _lastSync_decorators, { kind: "field", name: "lastSync", static: false, private: false, access: { has: obj => "lastSync" in obj, get: obj => obj.lastSync, set: (obj, value) => { obj.lastSync = value; } }, metadata: _metadata }, _lastSync_initializers, _lastSync_extraInitializers);
            __esDecorate(null, null, _syncVersion_decorators, { kind: "field", name: "syncVersion", static: false, private: false, access: { has: obj => "syncVersion" in obj, get: obj => obj.syncVersion, set: (obj, value) => { obj.syncVersion = value; } }, metadata: _metadata }, _syncVersion_initializers, _syncVersion_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _errorMessage_decorators, { kind: "field", name: "errorMessage", static: false, private: false, access: { has: obj => "errorMessage" in obj, get: obj => obj.errorMessage, set: (obj, value) => { obj.errorMessage = value; } }, metadata: _metadata }, _errorMessage_initializers, _errorMessage_extraInitializers);
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a.table = 'sync_status',
        _a;
})();
export default SyncStatus;
