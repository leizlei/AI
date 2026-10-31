import {makeAutoObservable, runInAction} from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {makePersistable} from 'mobx-persist-store';
import {v4 as uuidv4} from 'uuid';
import 'react-native-get-random-values';

/** A reusable system-prompt / instruction template the user can save and apply. */
export interface PromptTemplate {
  id: string;
  title: string;
  /** The system-prompt text injected ahead of the model. */
  content: string;
  createdAt: number;
}

/**
 * Library of user-saved prompt templates, persisted to AsyncStorage. Applying
 * a template is done by the caller (ChatScreen/ChatGenerationSettingsSheet)
 * so this store stays a plain data owner with no UI coupling.
 */
class PromptTemplateStore {
  templates: PromptTemplate[] = [];

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: 'PromptTemplateStore',
      properties: ['templates'],
      storage: AsyncStorage,
    });
  }

  all(): PromptTemplate[] {
    return this.templates;
  }

  add(title: string, content: string): PromptTemplate {
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

  remove(id: string): void {
    runInAction(() => {
      this.templates = this.templates.filter(t => t.id !== id);
    });
  }

  get(id: string): PromptTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }
}

export const promptTemplateStore = new PromptTemplateStore();
export {PromptTemplateStore};
