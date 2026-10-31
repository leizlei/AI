import {TalentEngine, TalentResult, ToolDefinition} from './types';
import type {DocumentStore} from '../documents/documentStore';
import {wrapUntrusted} from './untrustedContent';

/**
 * `local_docs` talent: searches documents the user imported into the on-device
 * document library. Only the matching chunks are returned — the raw file is
 * never injected into the chat context, which keeps prefill small.
 */
export class DocumentRetrievalEngine implements TalentEngine {
  readonly name = 'local_docs';
  readonly recommendedContextTokens = 1200;

  constructor(private docs: DocumentStore) {}

  async execute(args: Record<string, any>): Promise<TalentResult> {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    if (!query) {
      return {
        type: 'error',
        summary: 'local_docs: missing or empty "query" argument',
        errorMessage: 'query argument is required and must be a non-empty string',
      };
    }

    if (this.docs.count === 0) {
      const summary =
        'local_docs: no documents imported yet. Ask the user to add a text file in Settings → Document Library.';
      return {type: 'error', summary, errorMessage: summary};
    }

    const hits = this.docs.search(query);
    if (hits.length === 0) {
      const summary = `local_docs: no imported document mentions "${query}".`;
      return {type: 'error', summary, errorMessage: summary};
    }

    const block = hits
      .map((h, i) => `[${i + 1}] From "${h.name}":\n${h.text}`)
      .join('\n\n---\n\n');

    return {
      type: 'text',
      summary: wrapUntrusted(
        `## Matching excerpts from imported documents for "${query}"\n\n${block}`,
      ),
    };
  }

  systemPromptFragment(): string | null {
    return (
      'You have a `local_docs` tool that searches the user\'s imported on-device text files. ' +
      'Use it when the question concerns a document, log, note, or source file the user added, rather than web facts. ' +
      'Ground answers in the returned excerpts and cite the source file name; if no excerpt matches, say so.'
    );
  }

  toToolDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: 'local_docs',
        description:
          'Search the user\'s imported local text documents (txt/md/log/notes) for relevant excerpts. Use for questions about files the user added in the document library; returns only matching passages, not the whole file.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'Short keyword query describing what to look for in the imported documents.',
            },
          },
          required: ['query'],
        },
      },
    };
  }
}
