import { Async } from "domain/entities/Async";
import {
    UserMonitoringCountResponse,
    UserMonitoringDetails,
} from "domain/entities/user-monitoring/common/UserMonitoring";
import { UserWithoutTwoFactor } from "domain/entities/user-monitoring/common/UserWithoutTwoFactor";

export interface ReportRepository {
    saveReport(
        programId: string,
        responseGroups: UserMonitoringCountResponse,
        responseRoles: UserMonitoringDetails
    ): Promise<Async<string>>;

    saveUsersWithoutTwoFactor(programId: string, response: UserWithoutTwoFactor): Promise<string>;
}
