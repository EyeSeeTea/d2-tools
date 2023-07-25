import fs from "fs";
import { Async } from "domain/entities/Async";
import { DataSetExecutionRepository } from "domain/repositories/DataSetExecutionRepository";
import { NotificationStore } from "domain/usecases/SendNotificationDataValuesUseCase";
import { SettingsOptions } from "domain/repositories/SettingsRepository";

export class DataSetExecutionJsonRepository implements DataSetExecutionRepository {
    async save(value: NotificationStore, options: SettingsOptions): Async<void> {
        fs.writeFileSync(options.path, JSON.stringify(value, null, 4));
    }

    async get(options: SettingsOptions): Async<NotificationStore | undefined> {
        const fileContent = fs.readFileSync(options.path, "utf-8");
        if (!fileContent) return undefined;
        const executionsJson = JSON.parse(fileContent);
        return executionsJson;
    }
}
