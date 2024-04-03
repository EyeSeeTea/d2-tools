import { Async } from "domain/entities/Async";
import {
    Item,
    TemplateGroupWithAuthorities,
    User,
    UserMonitoringCountResponse,
    UsersOptions,
} from "domain/entities/UserMonitoring";
import { MetadataRepository } from "domain/repositories/user-monitoring/MetadataRepository";
import { ReportRepository } from "domain/repositories/user-monitoring/ReportRepository";
import _ from "lodash";

export class RunUserMonitoringReportUseCase {
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
