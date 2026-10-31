import { streamChatCompletion } from './openai';
import { pickSamplers } from '../utils/samplerParams';
import { normaliseTimings, } from '../utils/completionTypes';
import { RemoteModelRequestWithdrawnError } from '../utils/errors';
import { isModelNotLoaded } from './llamaServer/routerWire';
export class LocalCompletionEngine {
    constructor(context) {
        this.context = context;
    }
    async completion(params, callback) {
        const result = await this.context.completion(params, callback
            ? data => {
                callback({
                    token: data.token,
                    content: data.content,
                    reasoning_content: data.reasoning_content,
                    tool_calls: data.tool_calls,
                    accumulated_text: data.accumulated_text,
                });
            }
            : undefined);
        return {
            text: result.text,
            content: result.content,
            reasoning_content: result.reasoning_content,
            tool_calls: result.tool_calls,
            timings: normaliseTimings(result.timings),
            tokens_predicted: result.tokens_predicted,
            tokens_evaluated: result.tokens_evaluated,
            draft_tokens: result.draft_tokens,
            draft_tokens_accepted: result.draft_tokens_accepted,
            truncated: result.truncated,
            stopped_eos: result.stopped_eos,
            stopped_limit: result.stopped_limit,
            stopped_word: result.stopped_word,
            stopping_word: result.stopping_word,
            context_full: result.context_full,
            interrupted: result.interrupted,
        };
    }
    async stopCompletion() {
        await this.context.stopCompletion();
    }
}
export class OpenAICompletionEngine {
    constructor(endpoint, options = {}) {
        this.endpoint = endpoint;
        this.options = options;
        this.abortController = null;
    }
    async completion(params, callback) {
        const controller = new AbortController();
        this.abortController = controller;
        const { ensureReady } = this.options;
        if (!ensureReady) {
            return this.send(params, controller.signal, callback);
        }
        await ensureReady(controller.signal);
        if (controller.signal.aborted) {
            throw new RemoteModelRequestWithdrawnError();
        }
        let streamed = false;
        try {
            return await this.send(params, controller.signal, data => {
                streamed = true;
                callback?.(data);
            });
        }
        catch (error) {
            if (streamed || !isModelNotLoaded(error)) {
                throw error;
            }
            const ready = await ensureReady(controller.signal, { reread: true });
            if (controller.signal.aborted) {
                throw new RemoteModelRequestWithdrawnError();
            }
            if (ready !== true) {
                throw error;
            }
            return this.send(params, controller.signal, callback);
        }
    }
    send(params, signal, callback) {
        return streamChatCompletion({
            messages: params.messages || [],
            model: this.endpoint.remoteModelId,
            samplers: pickSamplers(params),
            stop: params.stop,
            stream: true,
            // llama.rn's `tools` typedef is structurally compatible with OpenAI's
            // function-tool shape but lives under a different name.
            tools: params.tools,
            tool_choice: params.tool_choice,
            response_format: params.response_format,
            // Reasoning intent carried on the params; the server profile owns the wire shape.
            reasoning: params.reasoning,
        }, this.endpoint, signal, callback);
    }
    async stopCompletion() {
        this.abortController?.abort();
        this.abortController = null;
    }
}
