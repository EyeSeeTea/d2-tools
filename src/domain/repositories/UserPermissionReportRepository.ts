import { ProgramMetadata } from "data/d2-users/D2Users.types";
import { Async } from "domain/entities/Async";
import { UserPermissionsCountResponse, UserPermissionsDetails } from "domain/entities/UserPermissions";

export interface UserPermissionReportRepository {
    pushReport(
        program: ProgramMetadata,
        responseGroups: UserPermissionsCountResponse,
        responseRoles: UserPermissionsDetails
    ): Promise<Async<void>>;
}
