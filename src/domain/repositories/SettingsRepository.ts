import { Async } from "domain/entities/Async";
import { Settings, SettingsOptions } from "domain/entities/Settings";

export interface SettingsRepository {
    get(options: SettingsOptions): Async<Settings>;
}
