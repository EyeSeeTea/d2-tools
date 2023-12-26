import { Async } from "domain/entities/Async";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import {
    DataElement,
    Program,
    ProgramMetadata,
    ProgramStage,
    ProgramStageDataElement,
    User,
    UserRoleAuthority,
} from "./d2-users/D2Users.types";
type Programs = { programs: Program[] };
type UserRoleAuthorities = { userRoles: UserRoleAuthority[] };
import _ from "lodash";

import {
    Item,
    TemplateGroup,
    TemplateGroupWithAuthorities,
    UsersOptions,
} from "domain/entities/UserPermissions";
import { UserPermissionMetadataRepository } from "domain/repositories/UserPermissionMetadataRepository";

type Users = { users: User[] };

export class UserPermissionMetadataD2Repository implements UserPermissionMetadataRepository {
    constructor(private api: D2Api) {}

    async getTemplateAuthorities(options: UsersOptions): Promise<Async<TemplateGroupWithAuthorities[]>> {
        const { templates: templateGroups, excludedRoles: excludedRoles } = options;

        const userRoles: UserRoleAuthority[] = await this.getAllUserRoles(options);
        log.info("Validating roles...");
        this.validateAuths(userRoles, excludedRoles);
        const completeTemplateGroups = await this.fillAuthorities(templateGroups, userRoles);
        return completeTemplateGroups;
    }

    async getAllUsers(excludedUsers: string[], exclude?: boolean): Promise<Async<User[]>> {
        log.info(`Get metadata: All users except: ${excludedUsers.join(",")}`);
        const filterOption = exclude ? "!in" : "in";
        const responses = await this.api
            .get<Users>(
                `/users.json?paging=false&fields=*,userCredentials[*]&filter=id:${filterOption}:[${excludedUsers.join(
                    ","
                )}]`
            )
            .getData();

        return responses["users"];
    }

    async getMetadata(programId: string): Promise<Async<ProgramMetadata>> {
        const responseProgram = await this.getProgram(this.api, programId);

        const programs = responseProgram[0] ?? undefined;

        if (programs === undefined) {
            log.error(`Program ${programId} not found`);
            throw new Error("Program ${pushProgramId} not found");
        }
        const programStage: ProgramStage | undefined = programs.programStages[0];
        //todo fix orgunit.id
        const orgunitstring = JSON.stringify(programs.organisationUnits[0]);
        const orgUnit: { id: string } = JSON.parse(orgunitstring);
        const orgUnitId: string = orgUnit.id;

        if (programStage === undefined) {
            log.error(`Programstage ${programId} not found`);
            throw new Error(`ProgramStage in ${programId} not found`);
        }

        if (orgUnitId === undefined) {
            log.error(`Organisation Unit ${programId} not found`);
            throw new Error(`Program OrgUnit in ${programId} not found`);
        }

        const programStageDataElements: ProgramStageDataElement[] = programStage.programStageDataElements;

        const dataElements: DataElement[] = programStageDataElements.map(item => {
            return item.dataElement;
        });

        const program: ProgramMetadata = {
            id: programId,
            programStageId: programStage.id,
            dataElements: dataElements,
            orgUnitId: orgUnitId,
        };
        return program;
    }

    async getAllUserRoles(options: UsersOptions): Promise<UserRoleAuthority[]> {
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

    async getProgram(api: D2Api, programUid: string): Promise<Program[]> {
        log.info(`Get metadata: Program metadata: ${programUid}`);

        const responses = await api
            .get<Programs>(
                `/programs?filter=id:eq:${programUid}&fields=id,organisationUnits[id],programStages[id,programStageDataElements[id,dataElement[id,name,code]]&paging=false.json`
            )
            .getData();

        return responses.programs;
    }

    //This method organize all the data into templateGroupWithAuthorities to make easy check all.
    private async fillAuthorities(
        templateGroups: TemplateGroup[],
        userRoles: UserRoleAuthority[]
    ): Promise<TemplateGroupWithAuthorities[]> {
        const userTemplateIds = templateGroups.map(template => {
            return template.template.id;
        });

        const allUserTemplates = await this.getAllUsers(userTemplateIds, false);

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

    private validateAuths(userRoles: UserRoleAuthority[], excludedRoles: Item[]) {
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
                log.error(`Trying to process invalid roles`);
                throw new Error(
                    "Roles with no authorities are not allowed. Fix them in the server or add in the ignore list"
                );
            }
        }
    }
}
