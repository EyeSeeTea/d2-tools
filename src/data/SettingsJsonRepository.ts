import fs from "fs";
import { Async } from "domain/entities/Async";
import { SettingsRepository } from "domain/repositories/SettingsRepository";
import { Settings, SettingsOptions } from "domain/entities/Settings";

export class SettingsJsonRepository implements SettingsRepository {
    get(options: SettingsOptions): Async<Settings> {
        const fileContent = fs.readFileSync(options.path, "utf-8");
        const settingsJson = JSON.parse(fileContent);
        return settingsJson;
    }
}
