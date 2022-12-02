import _ from "lodash";
import { systemSettingsStore } from "capture-core/metaDataMemoryStores/systemSettings/systemSettings.store";
import { Async } from "domain/entities/Async";
import { D2Api } from "types/d2-api";
import { UsersOptions } from "domain/repositories/UsersRepository";

export class D2Users {
    constructor(private api: D2Api) {
        systemSettingsStore.set({
            dateFormat: "YYYY-MM-DD",
        });
    }

    async run(options: UsersOptions): Async<void> {
        console.log("run" + options);
    }
}
