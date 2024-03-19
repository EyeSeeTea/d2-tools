import { TimeZoneInfo } from "domain/entities/TimeZoneInfo";
import { Async } from "../entities/Async";

export interface TimeZoneRepository {
    get(): Async<TimeZoneInfo>;
}
