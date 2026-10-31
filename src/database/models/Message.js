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
let Message = (() => {
    var _a;
    let _classSuper = Model;
    let _sessionId_decorators;
    let _sessionId_initializers = [];
    let _sessionId_extraInitializers = [];
    let _author_decorators;
    let _author_initializers = [];
    let _author_extraInitializers = [];
    let _text_decorators;
    let _text_initializers = [];
    let _text_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _position_decorators;
    let _position_initializers = [];
    let _position_extraInitializers = [];
    return _a = class Message extends _classSuper {
            toMessageObject() {
                const rawMetadata = JSON.parse(this.metadata || '{}');
                const author = {
                    id: this.author,
                    ...(rawMetadata.authorData || {}),
                };
                if (this.type === 'text') {
                    return {
                        id: this.id,
                        type: 'text',
                        text: this.text || '',
                        author,
                        createdAt: this.createdAt,
                        metadata: rawMetadata,
                        // Extract imageUris from metadata if present
                        imageUris: rawMetadata.imageUris,
                    };
                }
                if (this.type === 'assistant_turn') {
                    // Lift metadata.steps to the top-level `steps` field for the
                    // in-memory type. The persisted metadata keeps `steps` (the DB is
                    // the source of truth for crash recovery), but the in-memory
                    // metadata strips it so consumers reading `message.metadata.steps`
                    // get `undefined` — they must use `message.steps`. The
                    // persistence layer (ChatSessionRepository) is the sole writer of
                    // `metadata.steps` on the way back to disk.
                    const { steps: liftedSteps, ...metadataWithoutSteps } = rawMetadata;
                    const steps = Array.isArray(liftedSteps) ? liftedSteps : [];
                    return {
                        id: this.id,
                        type: 'assistant_turn',
                        author,
                        createdAt: this.createdAt,
                        steps,
                        metadata: metadataWithoutSteps,
                    };
                }
                return {
                    id: this.id,
                    type: this.type,
                    author,
                    createdAt: this.createdAt,
                    metadata: rawMetadata,
                };
            }
            constructor() {
                super(...arguments);
                this.sessionId = __runInitializers(this, _sessionId_initializers, void 0);
                this.author = (__runInitializers(this, _sessionId_extraInitializers), __runInitializers(this, _author_initializers, void 0));
                this.text = (__runInitializers(this, _author_extraInitializers), __runInitializers(this, _text_initializers, void 0));
                this.type = (__runInitializers(this, _text_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                this.createdAt = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
                this.metadata = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
                this.position = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _position_initializers, void 0));
                __runInitializers(this, _position_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _sessionId_decorators = [text('session_id')];
            _author_decorators = [text('author')];
            _text_decorators = [text('text')];
            _type_decorators = [text('type')];
            _createdAt_decorators = [field('created_at')];
            _metadata_decorators = [field('metadata')];
            _position_decorators = [field('position')];
            __esDecorate(null, null, _sessionId_decorators, { kind: "field", name: "sessionId", static: false, private: false, access: { has: obj => "sessionId" in obj, get: obj => obj.sessionId, set: (obj, value) => { obj.sessionId = value; } }, metadata: _metadata }, _sessionId_initializers, _sessionId_extraInitializers);
            __esDecorate(null, null, _author_decorators, { kind: "field", name: "author", static: false, private: false, access: { has: obj => "author" in obj, get: obj => obj.author, set: (obj, value) => { obj.author = value; } }, metadata: _metadata }, _author_initializers, _author_extraInitializers);
            __esDecorate(null, null, _text_decorators, { kind: "field", name: "text", static: false, private: false, access: { has: obj => "text" in obj, get: obj => obj.text, set: (obj, value) => { obj.text = value; } }, metadata: _metadata }, _text_initializers, _text_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
            __esDecorate(null, null, _position_decorators, { kind: "field", name: "position", static: false, private: false, access: { has: obj => "position" in obj, get: obj => obj.position, set: (obj, value) => { obj.position = value; } }, metadata: _metadata }, _position_initializers, _position_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a.table = 'messages',
        _a.associations = {
            chat_sessions: { type: 'belongs_to', key: 'session_id' },
        },
        _a;
})();
export default Message;
