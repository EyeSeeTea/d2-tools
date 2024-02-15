import { Async } from "domain/entities/Async";
import {
    Item,
    TemplateGroupWithAuthorities,
    User,
    UserMonitoringCountResponse,
} from "domain/entities/UserMonitoring";
import { UserGroupRepository } from "domain/repositories/UserGroupRepository";
import {
    UserMonitoringMetadataRepository,
    UsersOptions,
} from "domain/repositories/UserMonitoringMetadataRepository";
import { UserMonitoringReportRepository } from "domain/repositories/UserMonitoringReportRepository";
import _ from "lodash";
import log from "utils/log";

export class RunUserMonitoringReportUseCase {
    constructor(
        private userMonitoringMetadataRepository: UserMonitoringMetadataRepository,
        private userMonitoringReportRepository: UserMonitoringReportRepository
    ) {}

    async execute(options: UsersOptions): Async<void> {
        const { responseUserGroups, responseUserRoles } = options;

        const finalUserGroup = responseUserGroups ?? {
            listOfAffectedUsers: [],
            invalidUsersCount: 0,
            response: "",
        };
        const finalUserRoles = responseUserRoles ?? {
            listOfAffectedUsers: [],
            invalidUsersCount: 0,
            response: "",
            usersBackup: [],
            usersFixed: [],
            eventid: "",
            userProcessed: [],
        };
        if (finalUserGroup.invalidUsersCount > 0 || finalUserRoles.invalidUsersCount > 0) {
            const program = await this.userMonitoringMetadataRepository.getMetadata(options.pushProgramId.id);
            await this.userMonitoringReportRepository.pushReport(program, finalUserGroup, finalUserRoles);
        }
    }
}
