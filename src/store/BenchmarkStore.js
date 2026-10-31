import { makeAutoObservable, runInAction } from 'mobx';
import { makePersistable } from 'mobx-persist-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateBenchmarkResults, migrateBenchmarkResult, } from '../utils/benchmarkMigration';
export class BenchmarkStore {
    constructor() {
        this.results = [];
        makeAutoObservable(this);
        makePersistable(this, {
            name: 'BenchmarkStore',
            properties: ['results'],
            storage: AsyncStorage,
        }).then(() => {
            // Migrate benchmark results after loading from storage
            runInAction(() => {
                this.results = migrateBenchmarkResults(this.results);
            });
        });
    }
    addResult(result) {
        runInAction(() => {
            // Migrate the result in case it still has legacy format
            const migratedResult = migrateBenchmarkResult(result);
            this.results.unshift(migratedResult); // Add new result at the beginning
        });
    }
    removeResult(timestamp) {
        runInAction(() => {
            this.results = this.results.filter(result => result.timestamp !== timestamp);
        });
    }
    clearResults() {
        runInAction(() => {
            this.results = [];
        });
    }
    getResultsByModel(modelId) {
        return this.results.filter(result => result.modelId === modelId);
    }
    get latestResult() {
        return this.results[0];
    }
    markAsSubmitted(uuid) {
        runInAction(() => {
            const result = this.results.find(r => r.uuid === uuid);
            if (result) {
                result.submitted = true;
            }
        });
    }
}
export const benchmarkStore = new BenchmarkStore();
