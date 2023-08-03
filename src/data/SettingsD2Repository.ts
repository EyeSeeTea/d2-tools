import { D2Api } from "types/d2-api";
import { Async } from "domain/entities/Async";
import { SettingsRepository } from "domain/repositories/SettingsRepository";
import { Settings, SettingsOptions } from "domain/entities/Settings";
import { extractNamespaceAndKeyFromPath } from "./DataSetExecutionD2Repository";

export class SettingsD2Repository implements SettingsRepository {
    constructor(private api: D2Api) {}

    async get(options: SettingsOptions): Async<Settings> {
        const [namespace, key] = extractNamespaceAndKeyFromPath(options.path);
        const dataStore = this.api.dataStore(namespace);

        const settings = await dataStore.get<Settings>(key).getData();
        if (!settings) {
            throw Error(`Cannot found ${namespace}/${key} in datastore`);
        }
        return settings;
    }
}
