import { Async } from "domain/entities/Async";
import { UserAuthoritiesRepository } from "domain/repositories/UserAuthoritiesRepository";
import {
    UserPermissionMetadataRepository,
    UsersOptions,
} from "domain/repositories/UserPermissionMetadataRepository";
import { UserPermissionReportRepository } from "domain/repositories/UserPermissionReportRepository";

export class RunUserPermissionsUseCase {
    constructor(
        private userAuthoritiesRepository: UserAuthoritiesRepository,
        private userPermissionMetadataRepository: UserPermissionMetadataRepository,
        private userPermissionReportRepository: UserPermissionReportRepository
    ) {}

    async execute(options: UsersOptions): Async<void> {
        const templatesWithAuthorities = await this.userPermissionMetadataRepository.getTemplateAuthorities(
            options
        );

        const usersToProcessGroups = await this.userPermissionMetadataRepository.getAllUsers(
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

        const program = await this.userPermissionMetadataRepository.getMetadata(options.pushProgramId.id);
        const usersToProcessRoles = await this.userPermissionMetadataRepository.getAllUsers(
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
            await this.userPermissionReportRepository.pushReport(
                program,
                responseUserGroups,
                responseUserRolesProcessed
            );
        }
    }
}
