import { Async } from "domain/entities/Async";
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
