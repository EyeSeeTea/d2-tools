import { Async } from "domain/entities/Async";
import { PermissionFixerUserOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserOptions";
import { ReportRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/ReportRepository";
import _ from "lodash";

export class RunUserPermissionReportUseCase {
    constructor(private reportRepository: ReportRepository) {}

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
            await this.reportRepository.saveReport(options.pushProgramId.id, finalUserGroup, finalUserRoles);
        }
    }
}
