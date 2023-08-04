import { D2Api } from "types/d2-api";
import { Async } from "domain/entities/Async";
import { DataSetExecutionRepository } from "domain/repositories/DataSetExecutionRepository";
import { DataSetExecution } from "domain/usecases/SendNotificationDataValuesUseCase";
import { SettingsOptions } from "domain/entities/Settings";

export function extractNamespaceAndKeyFromPath(path: string): [string, string] {
    const [namespace, key] = path.split(".");
    if (!namespace || !key) {
        throw Error(`Unable to get namespace and key from ${path}`);
    }
    return [namespace, key];
}

export class DataSetExecutionD2Repository implements DataSetExecutionRepository {
    constructor(private api: D2Api) {}

    async save(value: DataSetExecution, options: SettingsOptions): Async<void> {
        const [namespace, key] = extractNamespaceAndKeyFromPath(options.path);
        const dataStore = this.api.dataStore(namespace);
        await dataStore.save(key, value).response();
    }

    async get(options: SettingsOptions): Async<DataSetExecution | undefined> {
        const [namespace, key] = extractNamespaceAndKeyFromPath(options.path);
        const dataStore = this.api.dataStore(namespace);
        return dataStore.get<DataSetExecution>(key).getData();
    }
}
