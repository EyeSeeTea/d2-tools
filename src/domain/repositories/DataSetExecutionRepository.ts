import { Async } from "domain/entities/Async";
import { NotificationStore } from "domain/usecases/SendNotificationDataValuesUseCase";
import { SettingsOptions } from "./SettingsRepository";

export interface DataSetExecutionRepository {
    get(options: SettingsOptions): Async<NotificationStore | undefined>;
    save(value: NotificationStore, options: SettingsOptions): Async<void>;
}
