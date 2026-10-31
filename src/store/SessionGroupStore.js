import { makeAutoObservable, runInAction } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makePersistable } from 'mobx-persist-store';
/**
 * User-defined chat folders/groups. Kept OUT of the WatermelonDB schema on
 * purpose: mapping `sessionId -> groupName` lives in a tiny MobX store that is
 * persisted to AsyncStorage, so no DB migration is needed and existing
 * date-based grouping in the sidebar keeps working untouched. Sessions with no
 * group continue to fall into their date bucket.
 */
class SessionGroupStore {
    constructor() {
        /** sessionId -> custom group name */
        this.groups = {};
        /** Ordered, distinct group names (insertion order). */
        this.groupOrder = [];
        makeAutoObservable(this);
        makePersistable(this, {
            name: 'SessionGroupStore',
            properties: ['groups', 'groupOrder'],
            storage: AsyncStorage,
        });
    }
    groupOf(sessionId) {
        return this.groups[sessionId] ?? '';
    }
    allGroups() {
        return this.groupOrder;
    }
    /** Assign a session to a group (empty name clears it). */
    setGroup(sessionId, groupName) {
        const trimmed = (groupName || '').trim();
        runInAction(() => {
            if (!trimmed) {
                delete this.groups[sessionId];
                this.pruneGroupOrder();
                return;
            }
            this.groups[sessionId] = trimmed;
            if (!this.groupOrder.includes(trimmed)) {
                this.groupOrder.push(trimmed);
            }
        });
    }
    /** Rename a group across all sessions that reference it. */
    renameGroup(oldName, newName) {
        const trimmed = (newName || '').trim();
        if (!trimmed || trimmed === oldName) {
            return;
        }
        runInAction(() => {
            for (const key of Object.keys(this.groups)) {
                if (this.groups[key] === oldName) {
                    this.groups[key] = trimmed;
                }
            }
            this.groupOrder = this.groupOrder.map(g => g === oldName ? trimmed : g);
            if (!this.groupOrder.includes(trimmed)) {
                this.groupOrder.push(trimmed);
            }
            this.pruneGroupOrder();
        });
    }
    /** Remove a group (sessions in it become ungrouped). */
    removeGroup(groupName) {
        runInAction(() => {
            for (const key of Object.keys(this.groups)) {
                if (this.groups[key] === groupName) {
                    delete this.groups[key];
                }
            }
            this.groupOrder = this.groupOrder.filter(g => g !== groupName);
        });
    }
    /** Drop a session's grouping when the session is deleted. */
    removeSession(sessionId) {
        runInAction(() => {
            delete this.groups[sessionId];
        });
    }
    pruneGroupOrder() {
        const used = new Set(Object.values(this.groups));
        this.groupOrder = this.groupOrder.filter(g => used.has(g));
    }
}
export const sessionGroupStore = new SessionGroupStore();
export { SessionGroupStore };
