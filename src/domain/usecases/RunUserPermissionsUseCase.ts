import { Async } from "domain/entities/Async";
import { UsersOptions, UserAuthoritiesRepository } from "domain/repositories/UserAuthoritiesRepository";

export class RunUserPermissionsUseCase {
    constructor(private userAuthoritiesRepository: UserAuthoritiesRepository) {}

    async execute(options: UsersOptions): Async<void> {
        const templatesWithAuthorities = await this.userAuthoritiesRepository.getTemplateAuthorities(options);

        const usersToProcessGroups = await this.userAuthoritiesRepository.getAllUsers(
            options.excludedUsers.map(item => {
                return item.id;
            })
        );

        const responseUserGroups = await this.userAuthoritiesRepository.processUserGroups(
            options,
            templatesWithAuthorities,
            usersToProcessGroups
        );

        const program = await this.userAuthoritiesRepository.getMetadata(options);
        const usersToProcessRoles = await this.userAuthoritiesRepository.getAllUsers(
            options.excludedUsers.map(item => {
                return item.id;
            })
        );

        const responseUserRolesProcessed = await this.userAuthoritiesRepository.processUserRoles(
            options,
            templatesWithAuthorities,
            usersToProcessRoles
        );
        if (options.pushReport) {
            await this.userAuthoritiesRepository.pushReport(
                program,
                responseUserGroups,
                responseUserRolesProcessed
            );
        }
    }
}
