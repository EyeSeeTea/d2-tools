import { Async } from "domain/entities/Async";
import { ProgramDetails } from "domain/entities/user-monitoring/common/ProgramDetails";
import {
    UserMonitoringCountResponse,
    UserMonitoringDetails,
} from "domain/entities/user-monitoring/common/UserMonitoring";

export interface PermissionFixerReportRepository {
    save(
        programId: string,
        responseGroups: UserMonitoringCountResponse,
        responseRoles: UserMonitoringDetails
    ): Promise<Async<string>>;
}
