import _ from "lodash";
import log from "utils/log";
import { Async } from "domain/entities/Async";

import { MessageRepository } from "domain/repositories/user-monitoring/common/MessageRepository";
import { UserRolesAuthoritiesRepository } from "domain/repositories/user-monitoring/user-roles-authorities-monitoring/UserRolesAuthoritiesRepository";
import { AuthoritiesRepository } from "domain/repositories/user-monitoring/user-roles-authorities-monitoring/AuthoritiesRepository";
import { UserRolesAuthoritiesMonitoringDataRepository } from "domain/repositories/user-monitoring/user-roles-authorities-monitoring/UserRolesAuthoritiesMonitoringDataRepository";

import { GetUserRolesAuthoritiesMonitoringDataUseCase } from "./GetUserRolesAuthoritiesMonitoringDataUseCase";
import { GetUserRolesAuthoritiesUseCase } from "./GetUserRolesAuthoritiesUseCase";
import { SaveUserRolesAuthoritiesMonitoringDataUseCase } from "./SaveUserRolesAuthoritiesMonitoringDataUseCase";
import { UserRole } from "domain/entities/user-monitoring/user-roles-authorities-monitoring/UserRole";
import { Authority } from "domain/entities/user-monitoring/user-roles-authorities-monitoring/Authority";
import { GetAuthoritiesUseCase } from "./GetAuthoritiesUseCase";

export class MonitorUserRolesAuthoritiesUseCase {
    constructor(
        private userRolesRepository: UserRolesAuthoritiesRepository,
        private authoritiesRepository: AuthoritiesRepository,
        private monitoringDataRepository: UserRolesAuthoritiesMonitoringDataRepository,
        private messageRepository: MessageRepository
    ) {}

    async execute(setDataStore: boolean): Async<void> {
        const userRoles = await new GetUserRolesAuthoritiesUseCase(this.userRolesRepository).execute();

        if (!setDataStore) {
            const { userRoleAuthorities: previousUserRoles } =
                await new GetUserRolesAuthoritiesMonitoringDataUseCase(
                    this.monitoringDataRepository
                ).execute();

            const availableAuthorities = await new GetAuthoritiesUseCase(
                this.authoritiesRepository
            ).execute();

            const newUserRoles = _.differenceBy(userRoles, previousUserRoles, "id");
            const deletedUserRoles = _.differenceBy(previousUserRoles, userRoles, "id");
            const updatedUserRoles = this.getUpdatedUserRoles(userRoles, previousUserRoles);

            const updatedUserRolesDiff: UserRoleWithAuthoritiesDiff[] = this.generateRoleAuthorityDiffs(
                updatedUserRoles,
                previousUserRoles,
                availableAuthorities
            );

            const newUserRolesMapped = this.mapUserRolesAuthorities(newUserRoles, availableAuthorities);
            const deletedUserRolesMapped = this.mapUserRolesAuthorities(
                deletedUserRoles,
                availableAuthorities
            );

            this.debugJSON("New user roles/authorities detected:", newUserRolesMapped);
            this.debugJSON("Deleted user roles/authorities detected:", deletedUserRolesMapped);
            this.debugJSON("Updated user roles/authorities detected:", updatedUserRoles);
            this.debugJSON("Updated user roles/authorities diff detected:", updatedUserRolesDiff);

            const messages = this.makeMessages(
                newUserRolesMapped,
                deletedUserRolesMapped,
                updatedUserRolesDiff
            );

            if (messages.length > 0) {
                log.info("Sending user roles/authorities change message...");
                log.debug(`User roles/authorities change message:\n${messages}`);
                await this.messageRepository.sendMessage("USER-ROLES-AUTHORITIES-MONITORING", messages);
            } else {
                log.info("No user roles/authorities changes detected.");
            }
        }

        log.info("Updating datastore...");
        await new SaveUserRolesAuthoritiesMonitoringDataUseCase(this.monitoringDataRepository).execute(
            userRoles
        );
    }

    private debugJSON(msg: string, data: any) {
        log.debug(`${msg} ${JSON.stringify(data, null, 2)}`);
    }

    private getUpdatedUserRoles(userRoles: UserRole[], previousUserRoles: UserRole[]) {
        return _.intersectionBy(userRoles, previousUserRoles, "id").filter(userRole => {
            const previousUserRole = previousUserRoles.find(ur => ur.id === userRole.id);
            return !_.isEqual(userRole.authorities, previousUserRole?.authorities);
        });
    }

    private mapAuthoritiesIdsToNames(authorityIds: string[], authoritiesList: Authority[]): Authority[] {
        return authorityIds.map(authId => {
            const authority = authoritiesList.find(a => a.id === authId);
            return authority ? authority : { id: authId, name: "DEPRECATED_AUTHORITY" };
        });
    }

    private generateRoleAuthorityDiffs(
        updatedUserRoles: UserRole[],
        previousUserRoles: UserRole[],
        availableAuthorities: Authority[]
    ): UserRoleWithAuthoritiesDiff[] {
        return updatedUserRoles.map(userRole => {
            const previousUserRole = previousUserRoles.find(ur => ur.id === userRole.id);
            const addedAuthorities = _.difference(userRole.authorities, previousUserRole?.authorities || []);
            const removedAuthorities = _.difference(
                previousUserRole?.authorities || [],
                userRole.authorities
            );
            return {
                id: userRole.id,
                name: userRole.name,
                addedAuthorities: this.mapAuthoritiesIdsToNames(addedAuthorities, availableAuthorities),
                removedAuthorities: this.mapAuthoritiesIdsToNames(removedAuthorities, availableAuthorities),
            };
        });
    }

    private mapUserRolesAuthorities(
        userRoles: UserRole[],
        authoritiesList: Authority[]
    ): UserRoleWithAuthorities[] {
        return userRoles.map(ur => {
            return {
                id: ur.id,
                name: ur.name,
                authorities: this.mapAuthoritiesIdsToNames(ur.authorities, authoritiesList),
            };
        });
    }

    private makeAuthoritiesMessage(userRoles: UserRoleWithAuthorities[]): string {
        return userRoles
            .map(
                ur =>
                    `- ${ur.name} (Id: ${ur.id}) with authorities:\n${ur.authorities
                        .map(a => `\t- Id: ${a.id} Name: ${a.name}`)
                        .join("\n")}`
            )
            .join("\n");
    }

    private makeAuthoritiesDiffMessage(diff: Authority[]): string {
        return diff.map(a => `\t\t- Id: ${a.id} Name: ${a.name}`).join("\n");
    }

    private makeMessages(
        newUserRoles: UserRoleWithAuthorities[],
        deletedUserRoles: UserRoleWithAuthorities[],
        diffs: UserRoleWithAuthoritiesDiff[]
    ): string {
        const messages = [];

        if (newUserRoles.length > 0) {
            messages.push(`New user roles detected:\n${this.makeAuthoritiesMessage(newUserRoles)}`);
        }

        if (deletedUserRoles.length > 0) {
            messages.push(`Deleted user roles detected:\n${this.makeAuthoritiesMessage(deletedUserRoles)}`);
        }

        if (diffs.length > 0) {
            messages.push(
                `Updated user roles detected:\n${diffs
                    .map(ur => {
                        const addedAuths = ur.addedAuthorities.length
                            ? `\t- Added authorities:\n${this.makeAuthoritiesDiffMessage(
                                  ur.addedAuthorities
                              )}`
                            : "";
                        const removedAuths = ur.removedAuthorities.length
                            ? `\t- Removed authorities:\n${this.makeAuthoritiesDiffMessage(
                                  ur.removedAuthorities
                              )}`
                            : "";
                        return `- ${ur.name} (Id: ${ur.id})\n${[addedAuths, removedAuths]
                            .filter(line => line !== "")
                            .join("\n")}`;
                    })
                    .join("\n")}`
            );
        }

        return messages.join("\n\n");
    }
}

type UserRoleWithAuthorities = Pick<UserRole, "id" | "name"> & {
    authorities: Authority[];
};

type UserRoleWithAuthoritiesDiff = Pick<UserRole, "id" | "name"> & {
    addedAuthorities: Authority[];
    removedAuthorities: Authority[];
};
