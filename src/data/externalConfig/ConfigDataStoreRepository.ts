/* import { D2Api, DataStore } from "../../types/d2-api";
import { ClientDataRepository } from "./ClientDataRepository";

const dataStoreNamespace = "d2-tools";

export class ConfigDataStoreRepository extends ClientDataRepository {
    public getOrCreateObject<T extends object>(key: string, defaultValue: T): Promise<T> {
        throw new Error("Method not implemented.");
    }
    private api: D2Api;
    private dataStore: DataStore;

    constructor(api: D2Api) {
        super();
        this.api = api;
        this.dataStore = this.api.dataStore(dataStoreNamespace);
    }

    public async getObject<T extends object>(key: string, defaultValue: T): Promise<T> {
        const value = await this.dataStore.get<T>(key).getData();
        if (!value) await this.saveObject(key, defaultValue);
        return value ?? defaultValue;
    }

    public async getObjectIfExists<T extends object>(key: string): Promise<T | undefined> {
        return this.dataStore.get<T>(key).getData();
    }

    private async saveObject<T extends object>(key: string, value: T): Promise<void> {
        await this.dataStore.save(key, value).getData();
    }
}
 */
