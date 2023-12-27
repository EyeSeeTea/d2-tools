import { Async } from "domain/entities/Async";
import { UserAuthoritiesRepository } from "domain/repositories/UserAuthoritiesRepository";
import {
    UserMonitoringMetadataRepository,
    UsersOptions,
} from "domain/repositories/UserMonitoringMetadataRepository";
import { UserMonitoringReportRepository } from "domain/repositories/UserMonitoringReportRepository";

export class RunUserMonitoringUseCase {
    constructor(
        private userAuthoritiesRepository: UserAuthoritiesRepository,
        private userMonitoringMetadataRepository: UserMonitoringMetadataRepository,
        private userMonitoringReportRepository: UserMonitoringReportRepository
    ) {}

    async execute(options: UsersOptions): Async<void> {
        const templatesWithAuthorities = await this.userMonitoringMetadataRepository.getTemplateAuthorities(
            options
        );

        const usersToProcessGroups = await this.userMonitoringMetadataRepository.getAllUsers(
            options.excludedUsers.map(item => {
                return item.id;
            }),
            true
        );

        const responseUserGroups = await this.userAuthoritiesRepository.processUserGroups(
            options,
            templatesWithAuthorities,
            usersToProcessGroups
        );

        const program = await this.userMonitoringMetadataRepository.getMetadata(options.pushProgramId.id);
        const usersToProcessRoles = await this.userMonitoringMetadataRepository.getAllUsers(
            options.excludedUsers.map(item => {
                return item.id;
            }),
            true
        );

        const responseUserRolesProcessed = await this.userAuthoritiesRepository.processUserRoles(
            options,
            templatesWithAuthorities,
            usersToProcessRoles
        );

        if (options.pushReport) {
            await this.userMonitoringReportRepository.pushReport(
                program,
                responseUserGroups,
                responseUserRolesProcessed
            );
        }
    }
}
