import { D2Api } from "types/d2-api";
import { Async } from "domain/entities/Async";
import { DataSetExecutionRepository } from "domain/repositories/DataSetExecutionRepository";
import { DataSetExecution } from "domain/usecases/SendNotificationDataValuesUseCase";
import { extractNameSpaceAndKeyFromPath, SettingsOptions } from "domain/entities/Settings";

export class DataSetExecutionD2Repository implements DataSetExecutionRepository {
    constructor(private api: D2Api) {}

    async save(value: DataSetExecution, options: SettingsOptions): Async<void> {
        const [namespace, key] = extractNameSpaceAndKeyFromPath(options.path);
        const dataStore = this.api.dataStore(namespace);
        await dataStore.save(key, value).response();
    }

    async get(options: SettingsOptions): Async<DataSetExecution | undefined> {
        const [namespace, key] = extractNameSpaceAndKeyFromPath(options.path);
        const dataStore = this.api.dataStore(namespace);
        return dataStore.get<DataSetExecution>(key).getData();
    }
}
