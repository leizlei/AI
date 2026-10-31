import { makeAutoObservable, runInAction } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makePersistable } from 'mobx-persist-store';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
/**
 * Library of user-saved prompt templates, persisted to AsyncStorage. Applying
 * a template is done by the caller (ChatScreen/ChatGenerationSettingsSheet)
 * so this store stays a plain data owner with no UI coupling.
 */
class PromptTemplateStore {
    constructor() {
        this.templates = [];
        makeAutoObservable(this);
        makePersistable(this, {
            name: 'PromptTemplateStore',
            properties: ['templates'],
            storage: AsyncStorage,
        });
    }
    all() {
        return this.templates;
    }
    add(title, content) {
        const t = {
            id: uuidv4(),
            title: (title || '').trim() || 'Untitled',
            content,
            createdAt: Date.now(),
        };
        runInAction(() => {
            this.templates = [t, ...this.templates];
        });
        return t;
    }
    remove(id) {
        runInAction(() => {
            this.templates = this.templates.filter(t => t.id !== id);
        });
    }
    get(id) {
        return this.templates.find(t => t.id === id);
    }
}
export const promptTemplateStore = new PromptTemplateStore();
export { PromptTemplateStore };
