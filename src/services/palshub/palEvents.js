import { clientHeaders, getApiBase } from './apiBase';
const send = (palId, type) => {
    try {
        fetch(`${getApiBase()}/api/mobile/pals/${encodeURIComponent(palId)}/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...clientHeaders() },
            body: JSON.stringify({ type }),
        }).catch(() => { });
    }
    catch { }
};
export const palEvents = { send };
