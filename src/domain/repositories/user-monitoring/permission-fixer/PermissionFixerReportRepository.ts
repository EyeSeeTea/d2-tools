import { Async } from "domain/entities/Async";
import {
    UserMonitoringBasicResult,
    UserMonitoringExtendedResult,
} from "domain/entities/user-monitoring/common/UserMonitoring";

export interface PermissionFixerReportRepository {
    save(
        programId: string,
        responseGroups: UserMonitoringBasicResult,
        responseRoles: UserMonitoringExtendedResult
    ): Promise<Async<string>>;
}
