import { D2Api } from "types/d2-api";
import { Async } from "domain/entities/Async";
import { ExecutionRepository } from "domain/repositories/ExecutionRepository";
import { Execution } from "domain/usecases/SendNotificationDataValuesUseCase";
import { SettingsOptions } from "domain/entities/Settings";

export function extractNamespaceAndKeyFromPath(path: string): [string, string] {
    const [namespace, key] = path.split(".");
    if (!namespace || !key) {
        throw Error(`Unable to get namespace and key from ${path}`);
    }
    return [namespace, key];
}

export class ExecutionD2Repository implements ExecutionRepository {
    constructor(private api: D2Api) {}

    async save(value: Execution, options: SettingsOptions): Async<void> {
        const [namespace, key] = extractNamespaceAndKeyFromPath(options.path);
        const dataStore = this.api.dataStore(namespace);
        await dataStore.save(key, value).response();
    }

    async get(options: SettingsOptions): Async<Execution | undefined> {
        const [namespace, key] = extractNamespaceAndKeyFromPath(options.path);
        const dataStore = this.api.dataStore(namespace);
        return dataStore.get<Execution>(key).getData();
    }
}
