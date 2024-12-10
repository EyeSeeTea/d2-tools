import { Async } from "domain/entities/Async";
import { UserMonitoringProgramMetadata } from "domain/entities/user-monitoring/common/UserMonitoringProgramMetadata";
import {
    PermissionFixerExtendedReport,
    PermissionFixerReport,
} from "domain/entities/user-monitoring/permission-fixer/PermissionFixerReport";

export interface PermissionFixerReportRepository {
    save(
        program: UserMonitoringProgramMetadata,
        responseGroups: PermissionFixerReport,
        responseRoles: PermissionFixerExtendedReport
    ): Async<string>;
}
