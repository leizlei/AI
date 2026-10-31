import { authService } from '../palshub/AuthService';
import { ACCOUNT_LINK_ENABLED } from './accountLink';
import { iapApi } from './iapApi';
export const BINDING_TIMEOUT_MS = 2000;
const getBinding = async () => {
    if (!ACCOUNT_LINK_ENABLED || !authService.isAuthenticated) {
        return null;
    }
    let timer;
    const timeout = new Promise(resolve => {
        timer = setTimeout(() => resolve(null), BINDING_TIMEOUT_MS);
    });
    try {
        return await Promise.race([iapApi.binding().catch(() => null), timeout]);
    }
    finally {
        clearTimeout(timer);
    }
};
export const bindingSource = { getBinding };
