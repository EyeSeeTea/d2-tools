import { Async } from "domain/entities/Async";
import {
    PermissionFixerExtendedReport,
    PermissionFixerReport,
} from "domain/entities/user-monitoring/permission-fixer/PermissionFixerReport";

export interface PermissionFixerReportRepository {
    save(
        programId: string,
        responseGroups: PermissionFixerReport,
        responseRoles: PermissionFixerExtendedReport
    ): Promise<Async<string>>;
}
