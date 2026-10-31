import {makeAutoObservable, runInAction} from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {makePersistable} from 'mobx-persist-store';
import * as RNFS from '@dr.pogodin/react-native-fs';
import {Platform} from 'react-native';
import {pick, types, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
import {v4 as uuidv4} from 'uuid';
import 'react-native-get-random-values';

/**
 * A chunk of an imported document kept for lightweight keyword retrieval.
 * The raw file is never pushed into the chat context — only matching chunks
 * are handed to the model through the `local_docs` talent.
 */
export interface StoredDocument {
  id: string;
  name: string;
  /** Plain-text chunks ready for retrieval. */
  chunks: string[];
  createdAt: number;
}

/** Rough character cap per chunk; keeps each retrieval hit compact in context. */
const CHUNK_SIZE = 800;
/** How many chunks the talent returns per query. */
const TOP_N = 3;
/** Hard cap on total stored characters per document to protect AsyncStorage. */
const MAX_DOC_CHARS = 400_000;

/** Split plain text into overlapping chunks sized around CHUNK_SIZE. */
const chunkText = (text: string): string[] => {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }
  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    // Prefer a paragraph boundary within the window, otherwise cut at size.
    let end = Math.min(start + CHUNK_SIZE, normalized.length);
    if (end < normalized.length) {
      const paraBreak = normalized.lastIndexOf('\n\n', end);
      if (paraBreak > start + CHUNK_SIZE / 2) {
        end = paraBreak;
      }
    }
    const slice = normalized.slice(start, end).trim();
    if (slice) {
      chunks.push(slice);
    }
    start = end;
    if (start < normalized.length) {
      // Small overlap so a sentence crossing a boundary stays retrievable.
      start = Math.max(start, end - 80);
    }
  }
  return chunks;
};

/** Tokenize a query: whitespace words plus CJK 2-grams for Chinese matching. */
const tokenize = (query: string): string[] => {
  const out: string[] = [];
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  out.push(...words);
  const cjk = query.toLowerCase().replace(/[^\u4e00-\u9fa5]/g, ' ');
  for (const seg of cjk.split(/\s+/)) {
    for (let i = 0; i + 2 <= seg.length; i++) {
      out.push(seg.slice(i, i + 2));
    }
  }
  return out.filter(t => t.length > 0);
};

class DocumentStore {
  documents: StoredDocument[] = [];

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: 'DocumentStore',
      properties: ['documents'],
      storage: AsyncStorage,
    });
  }

  get count(): number {
    return this.documents.length;
  }

  list(): StoredDocument[] {
    return this.documents;
  }

  async removeDocument(id: string): Promise<void> {
    runInAction(() => {
      this.documents = this.documents.filter(d => d.id !== id);
    });
  }

  async clearAll(): Promise<void> {
    runInAction(() => {
      this.documents = [];
    });
  }

  /** Pick a text file (txt/md/log/json/csv) and store its chunks. */
  async pickAndImport(): Promise<StoredDocument | null> {
    let res;
    try {
      res = await pick({
        type:
          Platform.OS === 'ios'
            ? ['public.text', 'public.plain-text', 'public.data']
            : [types.allFiles],
      });
    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        return null;
      }
      throw err;
    }
    if (!res || res.length === 0) {
      return null;
    }
    const file = res[0];
    const name = file.name ?? 'imported.txt';
    const raw = await RNFS.readFile(file.uri, 'utf8');
    if (!raw || !raw.trim()) {
      throw new Error('The selected file is empty or unreadable as text.');
    }
    const clipped = raw.slice(0, MAX_DOC_CHARS);
    const chunks = chunkText(clipped);
    if (chunks.length === 0) {
      throw new Error('No readable text found in the selected file.');
    }
    const doc: StoredDocument = {
      id: uuidv4(),
      name,
      chunks,
      createdAt: Date.now(),
    };
    runInAction(() => {
      this.documents = [doc, ...this.documents];
    });
    return doc;
  }

  /**
   * Lightweight keyword retrieval across imported documents. Returns up to
   * TOP_N best-matching chunks, each tagged with its source document name.
   */
  search(query: string, topN: number = TOP_N): {name: string; text: string; score: number}[] {
    const tokens = tokenize(query);
    if (tokens.length === 0) {
      return [];
    }
    const scored: {name: string; text: string; score: number}[] = [];
    for (const doc of this.documents) {
      for (const chunk of doc.chunks) {
        const hay = chunk.toLowerCase();
        let score = 0;
        for (const tok of tokens) {
          let idx = hay.indexOf(tok);
          while (idx !== -1) {
            score += tok.length >= 2 ? 2 : 1;
            idx = hay.indexOf(tok, idx + 1);
          }
        }
        if (score > 0) {
          scored.push({name: doc.name, text: chunk, score});
        }
      }
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, topN);
  }
}

export const documentStore = new DocumentStore();
export {DocumentStore};
