import { Async } from "domain/entities/Async";
import { ProgramDetails } from "domain/entities/user-monitoring/common/ProgramDetails";
import {
    UserMonitoringCountResponse,
    UserMonitoringDetails,
} from "domain/entities/user-monitoring/common/UserMonitoring";
import { UserWithoutTwoFactor } from "domain/entities/user-monitoring/common/UserWithoutTwoFactor";

export interface ReportRepository {
    saveReport(
        program: ProgramDetails,
        responseGroups: UserMonitoringCountResponse,
        responseRoles: UserMonitoringDetails
    ): Promise<Async<string>>;

    saveUsersWithoutTwoFactor(program: ProgramDetails, response: UserWithoutTwoFactor): Promise<string>;
}
