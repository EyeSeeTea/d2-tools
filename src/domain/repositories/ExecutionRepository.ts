import { Async } from "domain/entities/Async";
import { SettingsOptions } from "domain/entities/Settings";
import { Execution } from "domain/usecases/SendNotificationDataValuesUseCase";

export interface ExecutionRepository {
    get(options: SettingsOptions): Async<Execution | undefined>;
    save(value: Execution, options: SettingsOptions): Async<void>;
}
