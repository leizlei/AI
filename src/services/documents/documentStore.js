import { makeAutoObservable, runInAction } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makePersistable } from 'mobx-persist-store';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { Platform } from 'react-native';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
/** Rough character cap per chunk; keeps each retrieval hit compact in context. */
const CHUNK_SIZE = 800;
/** How many chunks the talent returns per query. */
const TOP_N = 3;
/** Hard cap on total stored characters per document to protect AsyncStorage. */
const MAX_DOC_CHARS = 400000;
/** Split plain text into overlapping chunks sized around CHUNK_SIZE. */
const chunkText = (text) => {
    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (!normalized) {
        return [];
    }
    const chunks = [];
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
const tokenize = (query) => {
    const out = [];
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
/**
 * Best-effort lift of Word document text from a .docx container. A .docx is a
 * zip whose body lives in word/document.xml; the visible text sits inside
 * <w:t> nodes. When the file picker returns the XML (or a partially decoded
 * copy of it) we can strip tags and recover the words. Returns the original
 * string when no recognizable Word markup is present.
 */
const extractDocxText = (raw) => {
    const hasDocXml = /<w:document|<w:body|<w:document xmlns|<w:t[^>]*>/i.test(raw);
    if (!hasDocXml) {
        return raw;
    }
    const paragraphs = raw.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [];
    if (paragraphs.length === 0) {
        return raw;
    }
    const lines = paragraphs.map(p => {
        const texts = p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) ?? [];
        return texts
            .map(t => t.replace(/<w:t[^>]*>/i, '').replace(/<\/w:t>$/i, ''))
            .join('')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    });
    return lines.filter(l => l.trim()).join('\n');
};
class DocumentStore {
    constructor() {
        this.documents = [];
        /** How many matching chunks a retrieval returns (user-configurable, 1-8). */
        this.retrievalChunkCount = TOP_N;
        makeAutoObservable(this);
        makePersistable(this, {
            name: 'DocumentStore',
            properties: ['documents', 'retrievalChunkCount'],
            storage: AsyncStorage,
        });
    }
    get count() {
        return this.documents.length;
    }
    list() {
        return this.documents;
    }
    /** Rename a stored document (updates the display name used by retrieval). */
    renameDocument(id, newName) {
        const trimmed = (newName || '').trim();
        if (!trimmed) {
            return;
        }
        runInAction(() => {
            const doc = this.documents.find(d => d.id === id);
            if (doc) {
                doc.name = trimmed;
            }
        });
    }
    async removeDocument(id) {
        runInAction(() => {
            this.documents = this.documents.filter(d => d.id !== id);
        });
    }
    async clearAll() {
        runInAction(() => {
            this.documents = [];
        });
    }
    /** Pick a text file (txt/md/log/json/csv) and store its chunks. */
    async pickAndImport() {
        let res;
        try {
            res = await pick({
                type: Platform.OS === 'ios'
                    ? ['public.text', 'public.plain-text', 'public.data']
                    : [types.allFiles],
            });
        }
        catch (err) {
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
        // docx files are zip containers; try to lift the plain text out of the
        // document.xml so users can import Word documents without extra deps.
        const text = /\.docx$/i.test(name) || name.toLowerCase().startsWith('word')
            ? extractDocxText(raw)
            : raw;
        if (!text.trim()) {
            throw new Error(/\.docx$/i.test(name)
                ? 'This .docx could not be read as text (Word files are compressed). Try saving it as .txt or .md instead.'
                : 'The selected file is empty or unreadable as text.');
        }
        const clipped = text.slice(0, MAX_DOC_CHARS);
        const chunks = chunkText(clipped);
        if (chunks.length === 0) {
            throw new Error('No readable text found in the selected file.');
        }
        const doc = {
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
     * `retrievalChunkCount` best-matching chunks, each tagged with its source
     * document name.
     */
    search(query, topN) {
        const limit = topN ?? this.retrievalChunkCount;
        const tokens = tokenize(query);
        if (tokens.length === 0) {
            return [];
        }
        const scored = [];
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
                    scored.push({ name: doc.name, text: chunk, score });
                }
            }
        }
        return scored.sort((a, b) => b.score - a.score).slice(0, limit);
    }
}
export const documentStore = new DocumentStore();
export { DocumentStore };
