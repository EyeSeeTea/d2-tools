import fs from "fs";
import { Async } from "domain/entities/Async";
import { Settings, SettingsOptions, SettingsRepository } from "domain/repositories/SettingsRepository";

export class SettingsJsonRepository implements SettingsRepository {
    get(options: SettingsOptions): Async<Settings> {
        const fileContent = fs.readFileSync(options.path, "utf-8");
        const settingsJson = JSON.parse(fileContent);
        return settingsJson;
    }
}
