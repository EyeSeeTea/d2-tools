import { Async } from "domain/entities/Async";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import { UserRoleAuthority } from "data/user-monitoring/d2-users/D2Users.types";
type UserRoleAuthorities = { userRoles: UserRoleAuthority[] };
import _ from "lodash";

import {
    TemplateGroup,
    TemplateGroupWithAuthorities,
} from "domain/entities/user-monitoring/common/Templates";
import { TemplateRepository } from "domain/repositories/user-monitoring/permission-fixer/TemplateRepository";
import { UserRepository } from "domain/repositories/user-monitoring/permission-fixer/UserRepository";
import { PermissionFixerUserOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserOptions";
import { NamedRef } from "domain/entities/Base";

export class PermissionFixerTemplateD2Repository implements TemplateRepository {
    constructor(private api: D2Api, private userMonitoringRepository: UserRepository) {}
    async getTemplateAuthorities(
        options: PermissionFixerUserOptions
    ): Promise<Async<TemplateGroupWithAuthorities[]>> {
        const { templates: templateGroups, excludedRoles: excludedRoles } = options;

        const userRoles: UserRoleAuthority[] = await this.getAllUserRoles(options);
        log.info("Validating roles...");
        const isAuthValid = this.validateAuths(userRoles, excludedRoles);
        if (!isAuthValid) {
            log.error(`Trying to process invalid roles`);
            throw new Error(
                "Roles with no authorities are not allowed. Fix them in the server or add in the ignore list"
            );
        }
        const completeTemplateGroups = await this.fillAuthorities(templateGroups, userRoles);
        return completeTemplateGroups;
    }

    async getAllUserRoles(options: PermissionFixerUserOptions): Promise<UserRoleAuthority[]> {
        log.info(`Get metadata: All roles excluding ids: ${options.excludedRoles.join(", ")}`);
        const excludeRoles = options.excludedRoles;
        if (excludeRoles.length == 0) {
            const responses = await this.api
                .get<UserRoleAuthorities>(`/userRoles.json?paging=false&fields=id,name,authorities`)
                .getData();

            return responses.userRoles;
        } else {
            const responses = await this.api
                .get<UserRoleAuthorities>(
                    `/userRoles.json?paging=false&fields=id,name,authorities&filter=id:!in:[${excludeRoles.join(
                        ","
                    )}]`
                )
                .getData();

            return responses.userRoles;
        }
    }

    //This method organize all the data into templateGroupWithAuthorities to make easy check all.
    private async fillAuthorities(
        templateGroups: TemplateGroup[],
        userRoles: UserRoleAuthority[]
    ): Promise<TemplateGroupWithAuthorities[]> {
        const userTemplateIds = templateGroups.map(template => {
            return template.template.id;
        });

        const allUserTemplates = await this.userMonitoringRepository.getAllUsers(userTemplateIds, false);

        const templateFilled: TemplateGroupWithAuthorities[] = templateGroups.map(item => {
            const user = allUserTemplates.find(template => {
                return template.id == item.template.id;
            });
            const templateAutorities = _.compact(
                user?.userCredentials.userRoles.flatMap(role => {
                    const userRoleAuthorities = userRoles.filter(userRoleitem => {
                        return userRoleitem.id == role.id;
                    });
                    return userRoleAuthorities.flatMap(userRoleitem => {
                        return userRoleitem.authorities;
                    });
                })
            );
            const validRolesByAuthority: UserRoleAuthority[] = _.compact(
                userRoles.map(role => {
                    const authorities = role.authorities.filter(authority => {
                        if (templateAutorities.indexOf(authority) >= 0) return authority;
                    });
                    if (
                        authorities.length === role.authorities.length &&
                        authorities.every(element => role.authorities.includes(element))
                    ) {
                        return role;
                    }
                })
            );

            const invalidRolesByAuthority: UserRoleAuthority[] = _.compact(
                userRoles.map(role => {
                    const authorities = role.authorities.filter(authority => {
                        if (templateAutorities.indexOf(authority) == -1) return authority;
                    });
                    if (authorities.length > 0) {
                        return role;
                    }
                })
            );

            const validRoles: string[] = _.compact(
                validRolesByAuthority.map(role => {
                    return role.id;
                })
            );

            const invalidRoles: string[] = _.compact(
                invalidRolesByAuthority.map(role => {
                    return role.id;
                })
            );
            return {
                group: item.group,
                template: item.template,
                validRolesByAuthority: validRolesByAuthority ?? [],
                invalidRolesByAuthority: invalidRolesByAuthority ?? [],
                validRolesById: validRoles ?? [],
                invalidRolesById: invalidRoles ?? [],
            };
        });
        return templateFilled;
    }

    private validateAuths(userRoles: UserRoleAuthority[], excludedRoles: NamedRef[]): boolean {
        const rolesWithInvalidAuth = userRoles.filter(role => {
            return role.authorities.length == 0;
        });
        if (rolesWithInvalidAuth.length > 0) {
            rolesWithInvalidAuth.forEach(role => {
                log.error(`Role ${role.id} - ${role.name} has no authorities`);
            });
            const excludedRoleIds = excludedRoles.map(excludeRole => {
                return excludeRole.id;
            });
            const invalidRolesExcluded = rolesWithInvalidAuth.filter(role => {
                return excludedRoleIds.includes(role.id);
            });
            if (rolesWithInvalidAuth.length - invalidRolesExcluded.length > 0) {
                return false;
            }
        }
        return true;
    }
}
