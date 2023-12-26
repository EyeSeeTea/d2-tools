import { ProgramMetadata } from "data/d2-users/D2Users.types";
import { Async } from "domain/entities/Async";
import { UserMonitoringCountResponse, UserMonitoringDetails } from "domain/entities/UserMonitoring";

export interface UserMonitoringReportRepository {
    pushReport(
        program: ProgramMetadata,
        responseGroups: UserMonitoringCountResponse,
        responseRoles: UserMonitoringDetails
    ): Promise<Async<void>>;
}
