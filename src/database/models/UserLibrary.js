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
let UserLibrary = (() => {
    var _a;
    let _classSuper = Model;
    let _userId_decorators;
    let _userId_initializers = [];
    let _userId_extraInitializers = [];
    let _palshubId_decorators;
    let _palshubId_initializers = [];
    let _palshubId_extraInitializers = [];
    let _purchasedAt_decorators;
    let _purchasedAt_initializers = [];
    let _purchasedAt_extraInitializers = [];
    let _purchaseId_decorators;
    let _purchaseId_initializers = [];
    let _purchaseId_extraInitializers = [];
    let _isDownloaded_decorators;
    let _isDownloaded_initializers = [];
    let _isDownloaded_extraInitializers = [];
    let _downloadPath_decorators;
    let _downloadPath_initializers = [];
    let _downloadPath_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    return _a = class UserLibrary extends _classSuper {
            get purchasedAtDate() {
                return new Date(this.purchasedAt);
            }
            constructor() {
                super(...arguments);
                this.userId = __runInitializers(this, _userId_initializers, void 0);
                this.palshubId = (__runInitializers(this, _userId_extraInitializers), __runInitializers(this, _palshubId_initializers, void 0));
                this.purchasedAt = (__runInitializers(this, _palshubId_extraInitializers), __runInitializers(this, _purchasedAt_initializers, void 0));
                this.purchaseId = (__runInitializers(this, _purchasedAt_extraInitializers), __runInitializers(this, _purchaseId_initializers, void 0));
                this.isDownloaded = (__runInitializers(this, _purchaseId_extraInitializers), __runInitializers(this, _isDownloaded_initializers, void 0));
                this.downloadPath = (__runInitializers(this, _isDownloaded_extraInitializers), __runInitializers(this, _downloadPath_initializers, void 0));
                this.createdAt = (__runInitializers(this, _downloadPath_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
                __runInitializers(this, _createdAt_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _userId_decorators = [field('user_id')];
            _palshubId_decorators = [field('palshub_id')];
            _purchasedAt_decorators = [field('purchased_at')];
            _purchaseId_decorators = [field('purchase_id')];
            _isDownloaded_decorators = [field('is_downloaded')];
            _downloadPath_decorators = [field('download_path')];
            _createdAt_decorators = [readonly, date('created_at')];
            __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: obj => "userId" in obj, get: obj => obj.userId, set: (obj, value) => { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
            __esDecorate(null, null, _palshubId_decorators, { kind: "field", name: "palshubId", static: false, private: false, access: { has: obj => "palshubId" in obj, get: obj => obj.palshubId, set: (obj, value) => { obj.palshubId = value; } }, metadata: _metadata }, _palshubId_initializers, _palshubId_extraInitializers);
            __esDecorate(null, null, _purchasedAt_decorators, { kind: "field", name: "purchasedAt", static: false, private: false, access: { has: obj => "purchasedAt" in obj, get: obj => obj.purchasedAt, set: (obj, value) => { obj.purchasedAt = value; } }, metadata: _metadata }, _purchasedAt_initializers, _purchasedAt_extraInitializers);
            __esDecorate(null, null, _purchaseId_decorators, { kind: "field", name: "purchaseId", static: false, private: false, access: { has: obj => "purchaseId" in obj, get: obj => obj.purchaseId, set: (obj, value) => { obj.purchaseId = value; } }, metadata: _metadata }, _purchaseId_initializers, _purchaseId_extraInitializers);
            __esDecorate(null, null, _isDownloaded_decorators, { kind: "field", name: "isDownloaded", static: false, private: false, access: { has: obj => "isDownloaded" in obj, get: obj => obj.isDownloaded, set: (obj, value) => { obj.isDownloaded = value; } }, metadata: _metadata }, _isDownloaded_initializers, _isDownloaded_extraInitializers);
            __esDecorate(null, null, _downloadPath_decorators, { kind: "field", name: "downloadPath", static: false, private: false, access: { has: obj => "downloadPath" in obj, get: obj => obj.downloadPath, set: (obj, value) => { obj.downloadPath = value; } }, metadata: _metadata }, _downloadPath_initializers, _downloadPath_extraInitializers);
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a.table = 'user_library',
        _a;
})();
export default UserLibrary;
