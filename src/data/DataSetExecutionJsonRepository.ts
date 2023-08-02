import fs from "fs";
import { Async } from "domain/entities/Async";
import { DataSetExecutionRepository } from "domain/repositories/DataSetExecutionRepository";
import { DataSetExecution } from "domain/usecases/SendNotificationDataValuesUseCase";
import { SettingsOptions } from "domain/entities/Settings";

export class DataSetExecutionJsonRepository implements DataSetExecutionRepository {
    async save(value: DataSetExecution, options: SettingsOptions): Async<void> {
        fs.writeFileSync(options.path, JSON.stringify(value, null, 4));
    }

    async get(options: SettingsOptions): Async<DataSetExecution | undefined> {
        const fileExists = fs.existsSync(options.path);
        if (!fileExists) return undefined;
        const fileContent = fs.readFileSync(options.path, "utf-8");
        const executionsJson = JSON.parse(fileContent);
        return executionsJson;
    }
}
