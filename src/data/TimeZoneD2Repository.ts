import _ from "lodash";
import { Async } from "domain/entities/Async";
import { D2Api } from "types/d2-api";
import { SystemInfo } from "@eyeseetea/d2-api/api/system";
import { TimeZoneRepository } from "domain/repositories/TimeZoneRepository";
import { TimeZoneInfo } from "domain/entities/TimeZoneInfo";

export class TimeZoneD2Repository implements TimeZoneRepository {
    constructor(private api: D2Api) {}

    async get(): Async<TimeZoneInfo> {
        const info = (await this.api.system.info.getData()) as SystemInfo & { serverTimeZoneId: string };
        return {
            timeZoneIANACode: info.serverTimeZoneId,
        };
    }
}
