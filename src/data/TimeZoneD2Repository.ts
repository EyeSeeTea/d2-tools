import _ from "lodash";
import { Async } from "domain/entities/Async";
import { D2Api } from "types/d2-api";
import { TimeZoneRepository } from "domain/repositories/TimeZoneRepository";
import { TimeZoneInfo } from "domain/entities/TimeZoneInfo";

export class TimeZoneD2Repository implements TimeZoneRepository {
    constructor(private api: D2Api) {}

    async get(): Async<TimeZoneInfo> {
        const info = await this.api.system.info.getData();
        return {
            // d2-api does not expose the time zone attribute
            // (https://github.com/EyeSeeTea/d2-api/blob/development/src/api/system.ts#L160)
            // @ts-ignore
            timeZoneIANACode: info.serverTimeZoneId,
        };
    }
}
