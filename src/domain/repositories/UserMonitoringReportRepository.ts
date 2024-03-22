import { ProgramMetadata } from "data/d2-users/D2Users.types";
import { Async } from "domain/entities/Async";
import {
    UserMonitoringCountResponse,
    UserMonitoringDetails,
    UserWithoutTwoFactor,
} from "domain/entities/UserMonitoring";

export interface UserMonitoringReportRepository {
    pushReport(
        program: ProgramMetadata,
        responseGroups: UserMonitoringCountResponse,
        responseRoles: UserMonitoringDetails
    ): Promise<Async<void>>;

    saveUsersWithoutTwoFactor(program: ProgramMetadata, response: UserWithoutTwoFactor): Promise<void>;
}
