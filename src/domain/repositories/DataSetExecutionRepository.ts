import { Async } from "domain/entities/Async";
import { SettingsOptions } from "domain/entities/Settings";
import { DataSetExecution } from "domain/usecases/SendNotificationDataValuesUseCase";

export interface DataSetExecutionRepository {
    get(options: SettingsOptions): Async<DataSetExecution | undefined>;
    save(value: DataSetExecution, options: SettingsOptions): Async<void>;
}
