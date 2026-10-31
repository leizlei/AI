import { getAuthHeaders } from '../palshub/supabase';
import { clientHeaders, getApiBase } from '../palshub/apiBase';
import { linkBody, parseBinding, parseRefresh, parseVerify, refreshBody, verifyBody, } from './iapWire';
export const VERIFY_MAX_TRANSACTIONS = {
    ios: 50,
    android: 10,
};
export const REFRESH_MAX_KNOWN = 200;
export const REQUEST_TIMEOUT_MS = 15000;
export class IapHttpError extends Error {
    constructor(status) {
        super(`HTTP ${status}`);
        this.status = status;
        this.name = 'IapHttpError';
    }
}
const chunk = (items, size) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
};
const request = async (path, { method, body, auth }) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...clientHeaders(),
        };
        if (auth) {
            const { Authorization } = (await getAuthHeaders());
            if (Authorization) {
                headers.Authorization = Authorization;
            }
        }
        const response = await fetch(`${getApiBase()}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new IapHttpError(response.status);
        }
        return await response.json().catch(() => null);
    }
    finally {
        clearTimeout(timer);
    }
};
const purchaseKey = (result) => `${result.palId} ${result.supportCode}`;
const revocationWins = (results) => {
    const revoked = new Map(results
        .filter(result => result.status === 'revoked' && result.supportCode)
        .map(result => [purchaseKey(result), result]));
    return results.map(result => result.status === 'active' && result.supportCode
        ? (revoked.get(purchaseKey(result)) ?? result)
        : result);
};
const verify = async (platform, proofs) => {
    const results = [];
    for (const batch of chunk(proofs, VERIFY_MAX_TRANSACTIONS[platform])) {
        const json = await request('/api/mobile/iap/verify', {
            method: 'POST',
            body: verifyBody(platform, batch),
            auth: false,
        });
        results.push(...parseVerify(json));
    }
    return revocationWins(results);
};
const refresh = async (platform, proofs, known) => {
    const proofBatches = chunk(proofs, VERIFY_MAX_TRANSACTIONS[platform]);
    const knownBatches = chunk(Object.entries(known), REFRESH_MAX_KNOWN);
    const requests = Math.max(proofBatches.length, knownBatches.length, 1);
    const changed = new Map();
    const revoked = new Set();
    const removed = new Set();
    const unchanged = new Set();
    for (let i = 0; i < requests; i++) {
        const json = await request('/api/mobile/iap/entitlements/refresh', {
            method: 'POST',
            body: refreshBody(platform, proofBatches[i] ?? [], Object.fromEntries(knownBatches[i] ?? [])),
            auth: false,
        });
        const result = parseRefresh(json);
        result.changed.forEach(entry => changed.set(entry.pal.id, entry));
        result.revoked.forEach(id => revoked.add(id));
        result.removed.forEach(id => removed.add(id));
        result.unchanged.forEach(id => unchanged.add(id));
    }
    return {
        changed: [...changed.values()].filter(entry => !revoked.has(entry.pal.id)),
        revoked: [...revoked],
        removed: [...removed],
        unchanged: [...unchanged],
    };
};
const link = async (platform, proofs) => {
    try {
        await request('/api/mobile/iap/link', {
            method: 'POST',
            body: linkBody(platform, proofs),
            auth: true,
        });
        return 'linked';
    }
    catch (error) {
        if (error instanceof IapHttpError && error.status === 409) {
            return 'conflict';
        }
        throw error;
    }
};
const binding = async () => parseBinding(await request('/api/mobile/iap/binding', { method: 'GET', auth: true }));
export const iapApi = { verify, refresh, link, binding };
