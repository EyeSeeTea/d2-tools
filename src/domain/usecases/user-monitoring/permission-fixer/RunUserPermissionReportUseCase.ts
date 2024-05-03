import { Async } from "domain/entities/Async";
import { PermissionFixerUserOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserOptions";
import { PermissionFixerReportRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerReportRepository";
import _ from "lodash";

export class RunUserPermissionReportUseCase {
    constructor(private reportRepository: PermissionFixerReportRepository) {}

    async execute(options: PermissionFixerUserOptions): Async<void> {
        const { userRolesResponse, userGroupsResponse } = options;

        const finalUserGroup = userGroupsResponse ?? {
            listOfAffectedUsers: [],
            invalidUsersCount: 0,
            response: "",
        };
        const finalUserRoles = userRolesResponse ?? {
            listOfAffectedUsers: [],
            invalidUsersCount: 0,
            response: "",
            usersBackup: [],
            usersFixed: [],
            eventid: "",
            userProcessed: [],
        };
        if (finalUserGroup.invalidUsersCount > 0 || finalUserRoles.invalidUsersCount > 0) {
            await this.reportRepository.save(options.pushProgramId.id, finalUserGroup, finalUserRoles);
        }
    }
}
