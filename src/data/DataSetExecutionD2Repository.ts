import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { DataSetExecutionRepository } from "domain/repositories/DataSetExecutionRepository";
import { NotificationStore } from "domain/usecases/SendNotificationDataValuesUseCase";
import { SettingsOptions } from "domain/repositories/SettingsRepository";

const key = "executions";

export class DataSetExecutionD2Repository implements DataSetExecutionRepository {
    constructor(private api: D2Api) {}

    async save(value: NotificationStore, options: SettingsOptions): Async<void> {
        const dataStore = this.api.dataStore(options.namespace);
        await dataStore.save(key, value).response();
    }

    async get(options: SettingsOptions): Async<NotificationStore | undefined> {
        const dataStore = this.api.dataStore(options.namespace);
        return dataStore.get<NotificationStore>(key).getData();
    }
}
