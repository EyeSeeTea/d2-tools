import { Async } from "domain/entities/Async";
import { UsersOptions } from "domain/entities/user-monitoring/common/UserOptions";
import { MetadataRepository } from "domain/repositories/user-monitoring/common/MetadataRepository";
import { ReportRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/ReportRepository";
import _ from "lodash";

export class RunUserPermissionReportUseCase {
    constructor(private metadataRepository: MetadataRepository, private reportRepository: ReportRepository) {}

    async execute(options: UsersOptions): Async<void> {
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
            const program = await this.metadataRepository.getMetadata(options.pushProgramId.id);
            await this.reportRepository.saveReport(program, finalUserGroup, finalUserRoles);
        }
    }
}
