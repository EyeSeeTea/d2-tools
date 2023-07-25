import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { Settings, SettingsOptions, SettingsRepository } from "domain/repositories/SettingsRepository";

export class SettingsD2Repository implements SettingsRepository {
    constructor(private api: D2Api) {}

    async get(options: SettingsOptions): Async<Settings> {
        const key = "settings";
        const dataStore = this.api.dataStore(options.namespace);

        const settings = await dataStore.get<Settings>(key).getData();
        if (!settings) {
            throw Error(`Cannot found ${options.namespace}/${key} in datastore`);
        }
        return settings;
    }
}
