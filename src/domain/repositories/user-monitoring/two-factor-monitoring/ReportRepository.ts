import { ProgramMetadata } from "data/d2-users/D2Users.types";
import { Async } from "domain/entities/Async";
import {
    UserMonitoringCountResponse,
    UserMonitoringDetails,
} from "domain/entities/user-monitoring/common/UserMonitoring";
import { UserWithoutTwoFactor } from "domain/entities/user-monitoring/common/UserWithoutTwoFactor";

export interface ReportRepository {
    saveReport(
        program: ProgramMetadata,
        responseGroups: UserMonitoringCountResponse,
        responseRoles: UserMonitoringDetails
    ): Promise<Async<string>>;

    saveUsersWithoutTwoFactor(program: ProgramMetadata, response: UserWithoutTwoFactor): Promise<string>;
}
