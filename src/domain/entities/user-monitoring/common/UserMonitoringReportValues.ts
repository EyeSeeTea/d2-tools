import { Id } from "domain/entities/Base";

export interface UserMonitoringReportValues {
    dataElement: Id;
    value: string | number;
}
