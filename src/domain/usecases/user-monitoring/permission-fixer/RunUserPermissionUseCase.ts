import { PermissionFixerConfigRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerConfigRepository";
import { PermissionFixerTemplateRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerTemplateRepository";
import { RolesByRoles } from "domain/entities/user-monitoring/permission-fixer/RolesByRoles";
import { RolesByGroup } from "domain/entities/user-monitoring/permission-fixer/RolesByGroup";
import { RolesByUser } from "domain/entities/user-monitoring/permission-fixer/RolesByUser";
import { Ref } from "domain/entities/Base";
import {
    PermissionFixerReport,
    PermissionFixerExtendedReport,
} from "domain/entities/user-monitoring/permission-fixer/PermissionFixerReport";
import { PermissionFixerUserGroupRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerUserGroupRepository";
import log from "utils/log";
import { NamedRef } from "domain/entities/Base";
import { PermissionFixerReportRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerReportRepository";
import { PermissionFixerTemplateGroupExtended } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerTemplates";
import { UserMonitoringUserResponse } from "domain/entities/user-monitoring/common/UserMonitoringUserResponse";
import { UserMonitoringProgramRepository } from "domain/repositories/user-monitoring/common/UserMonitoringProgramRepository";
import { PermissionFixerMetadataConfig } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerConfigOptions";
import { PermissionFixerUserRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerUserRepository";
import { PermissionFixerUser } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUser";
import { Async } from "domain/entities/Async";
import { UserTemplateNotFoundException } from "domain/entities/user-monitoring/two-factor-monitoring/exception/UserTemplateNotFoundException";
import _ from "lodash";

export class RunUserPermissionUseCase {
    constructor(
        private configRepository: PermissionFixerConfigRepository,
        private reportRepository: PermissionFixerReportRepository,
        private templateRepository: PermissionFixerTemplateRepository,
        private userGroupRepository: PermissionFixerUserGroupRepository,
        private userRepository: PermissionFixerUserRepository,
        private programRepository: UserMonitoringProgramRepository
    ) {}

    async execute() {
        const options = await this.configRepository.get();

        const programMetadata = await this.programRepository.get(options.pushProgram.id);
        if (!programMetadata) {
            throw new Error("Metadata not found in the server. Check the program id.");
        }
        const userTemplateIds = options.templates.map(template => {
            return template.template.id;
        });

        const allUserTemplates = await this.userRepository.getAllUsers(userTemplateIds, false);

        const templatesWithAuthorities = await this.templateRepository.getTemplateAuthorities(
            options,
            allUserTemplates
        );

        const usersToProcessGroups = await this.userRepository.getAllUsers(
            options.excludedUsers.map(item => {
                return item.id;
            }),
            true
        );

        log.info(`Processing userGroups (all users must have at least one template user group)`);
        const responseUserGroups = await this.processUserGroups(
            options,
            templatesWithAuthorities,
            usersToProcessGroups
        );

        log.info(`Run user Role monitoring`);
        const usersToProcessRoles = await this.userRepository.getAllUsers(
            options.excludedUsers.map(item => {
                return item.id;
            }),
            true
        );

        const responseUserRolesProcessed = await this.processUserRoles(
            options,
            templatesWithAuthorities,
            usersToProcessRoles
        );

        const finalUserGroup = responseUserGroups ?? {
            listOfAffectedUsers: [],
            invalidUsersCount: 0,
            response: "",
        };
        const finalUserRoles = responseUserRolesProcessed ?? {
            listOfAffectedUsers: [],
            invalidUsersCount: 0,
            response: "",
            usersBackup: [],
            usersFixed: [],
            eventid: "",
            userProcessed: [],
        };
        if (
            options.permissionFixerConfig.pushReport &&
            (finalUserGroup.invalidUsersCount > 0 || finalUserRoles.invalidUsersCount > 0)
        ) {
            log.info(`Sending user-monitoring user-permissions report results`);
            await this.reportRepository.save(programMetadata, finalUserGroup, finalUserRoles);
        } else {
            log.info(`Nothing to report. No invalid users found.`);
        }
    }

    private preProcessUsers(
        allUsers: PermissionFixerUser[],
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        forceMinimalGroupForUsersWithoutGroup: boolean,
        minimalGroupId: string
    ) {
        if (forceMinimalGroupForUsersWithoutGroup) {
            log.info(
                "forceMinimalGroupForUsersWithoutGroup is enabled. Adding minimal group to users without group."
            );
            const usersWithForcedMinimalGroup = this.addMinimalUserGroupToUsersWithoutUserGroup(
                allUsers,
                completeTemplateGroups,
                minimalGroupId
            );
            return usersWithForcedMinimalGroup;
        } else {
            return allUsers;
        }
    }

    async processUserRoles(
        options: PermissionFixerMetadataConfig,
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        allUsers: PermissionFixerUser[]
    ): Async<PermissionFixerExtendedReport> {
        const {
            minimalGroup,
            minimalRole,
            permissionFixerConfig: { pushFixedUsersRoles, forceMinimalGroupForUsersWithoutGroup },
            excludedRolesByRole,
            excludedRolesByUser,
            excludedRolesByGroup,
        } = options;

        const allPreProcessedUsers = this.preProcessUsers(
            allUsers,
            completeTemplateGroups,
            forceMinimalGroupForUsersWithoutGroup,
            minimalGroup.id
        );

        this.validateUsers(allPreProcessedUsers, completeTemplateGroups, minimalGroup.id);
        const userinfo: UserMonitoringUserResponse[] = this.processUsers(
            allPreProcessedUsers,
            completeTemplateGroups,
            excludedRolesByRole,
            excludedRolesByGroup,
            excludedRolesByUser,
            minimalRole
        );

        //users without user groups
        const usersWithErrorsInGroups = userinfo.filter(item => item.undefinedUserGroups);

        if (usersWithErrorsInGroups.length > 0) {
            throw new Error("Still having users without any template user group.");
        }
        //users with action required
        const usersToBeFixed = userinfo.filter(item => item.actionRequired);

        if (usersToBeFixed.length == 0) {
            //nothing to do
            return {
                invalidUsersCount: 0,
                response: "",
                usersBackup: [],
                usersFixed: [],
                userProcessed: [],
                listOfAffectedUsers: [],
            };
        } else {
            log.info(usersToBeFixed.length + " users will be fixed");

            log.info(usersToBeFixed.length + " users will be pushed");

            log.info("Users processed. Starting push...");

            const userToPost: PermissionFixerUser[] = usersToBeFixed.map(item => {
                return item.fixedUser;
            });
            const userBackup: PermissionFixerUser[] = usersToBeFixed.map(item => {
                return item.user;
            });
            log.info("Push status: " + pushFixedUsersRoles);
            const response = pushFixedUsersRoles
                ? (await this.userRepository.saveUsers(userToPost)) ?? "Empty response"
                : "Test_mode";

            return {
                invalidUsersCount: usersToBeFixed.length,
                response: await response,
                usersBackup: userBackup,
                usersFixed: userToPost,
                userProcessed: usersToBeFixed,
                listOfAffectedUsers: usersToBeFixed.map(item => {
                    return { id: item.fixedUser.id, name: item.fixedUser.username };
                }),
            };
        }
    }

    private processUsers(
        allUsers: PermissionFixerUser[],
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        excludedRolesByRole: RolesByRoles[],
        excludedRolesByGroup: RolesByGroup[],
        excludedRolesByUser: RolesByUser[],
        minimalRole: Ref
    ): UserMonitoringUserResponse[] {
        log.info("Processing users...");
        const processedUsers = _.compact(
            allUsers.map(user => {
                const templateGroupMatch = completeTemplateGroups.find(template => {
                    return user.userGroups.some(
                        userGroup => userGroup != undefined && template.group.id == userGroup.id
                    );
                });
                const AllGroupMatch = completeTemplateGroups.filter(template => {
                    return user.userGroups.some(
                        userGroup => userGroup != undefined && template.group.id == userGroup.id
                    );
                });

                if (user.userCredentials.userRoles === undefined) {
                    const fixedUser = JSON.parse(JSON.stringify(user));
                    fixedUser.userCredentials.userRoles = [{ id: minimalRole.id }];
                    fixedUser.userRoles = [{ id: minimalRole.id }];
                    const userInfoRes: UserMonitoringUserResponse = {
                        user: user,
                        fixedUser: fixedUser,
                        validUserRoles: [{ id: minimalRole.id, name: "Minimal Role" }],
                        actionRequired: true,
                        invalidUserRoles: [],
                        userNameTemplate: "User don't have roles",
                        templateIdTemplate: "User don't have roles",
                        groupIdTemplate: "User don't have roles",
                        undefinedRoles: true,
                    };
                    return userInfoRes;
                } else {
                    const allValidRolesSingleList = _.uniqWith(
                        AllGroupMatch.flatMap(item => {
                            return item.validRolesById;
                        }),
                        _.isEqual
                    );
                    const allInValidRolesSingleList: string[] = _.uniqWith(
                        AllGroupMatch.flatMap(item => {
                            return item.invalidRolesById;
                        }),
                        _.isEqual
                    );

                    const allExceptionsToBeIgnoredByUser: string[] = _.compact(
                        excludedRolesByUser.flatMap(item => {
                            if (item.user.id == user.id) return item.role.id;
                        })
                    );

                    const allExceptionsToBeIgnoredByGroup: string[] = _.compact(
                        excludedRolesByGroup.flatMap(itemexception => {
                            const exist = user.userGroups.some(item => {
                                return item.id === itemexception.group.id;
                            });
                            if (exist) {
                                return itemexception.role.id;
                            } else {
                                return [];
                            }
                        })
                    );

                    const allExceptionsToBeIgnoredByRole: string[] = _.compact(
                        excludedRolesByRole.flatMap(item => {
                            if (item.active_role.id in user.userRoles) return item.ignore_role.id;
                        })
                    );
                    const allValidRolesSingleListWithExceptions = _.concat(
                        allValidRolesSingleList,
                        allExceptionsToBeIgnoredByRole,
                        allExceptionsToBeIgnoredByUser,
                        allExceptionsToBeIgnoredByGroup
                    );
                    //the invalid roles are the ones that are not in the valid roles
                    const allInvalidRolesSingleListFixed = allInValidRolesSingleList?.filter(item => {
                        return allValidRolesSingleListWithExceptions.indexOf(item) == -1;
                    });
                    //fill the valid roles in the user  against all the possible valid roles
                    const userValidRoles = user.userCredentials.userRoles.filter(userRole => {
                        return (
                            JSON.stringify(allValidRolesSingleListWithExceptions).indexOf(userRole.id) >= 0
                        );
                    });

                    //fill the invalid roles in the user against all the possible invalid roles
                    const userInvalidRoles = user.userCredentials.userRoles.filter(userRole => {
                        return (
                            JSON.stringify(allValidRolesSingleListWithExceptions).indexOf(userRole.id) ==
                                -1 && JSON.stringify(allInvalidRolesSingleListFixed).indexOf(userRole.id) >= 0
                        );
                    });

                    //clone user
                    const fixedUser = JSON.parse(JSON.stringify(user));
                    fixedUser.userCredentials.userRoles = userValidRoles;
                    fixedUser.userRoles = userValidRoles;
                    const userTemplateGroupMatch = templateGroupMatch ?? undefined;
                    if (userTemplateGroupMatch == undefined) {
                        throw new UserTemplateNotFoundException(
                            "User: " + user.username + " don't have valid template-groups"
                        );
                    }
                    if (AllGroupMatch.length > 1) {
                        log.debug(`Debug: User have more than 1 group ${user.id} - ${user.name}`);
                        const userInfoRes: UserMonitoringUserResponse = {
                            user: user,
                            fixedUser: fixedUser,
                            validUserRoles: userValidRoles,
                            actionRequired: userInvalidRoles.length > 0,
                            invalidUserRoles: userInvalidRoles,
                            userNameTemplate: userTemplateGroupMatch.template.name,
                            templateIdTemplate: userTemplateGroupMatch.template.id,
                            groupIdTemplate: userTemplateGroupMatch.group.id,
                            multipleUserGroups: AllGroupMatch.map(item => item.group.id),
                        };
                        return userInfoRes;
                    } else {
                        const userInfoRes: UserMonitoringUserResponse = {
                            user: user,
                            fixedUser: fixedUser,
                            validUserRoles: userValidRoles,
                            actionRequired: userInvalidRoles.length > 0,
                            invalidUserRoles: userInvalidRoles,
                            userNameTemplate: userTemplateGroupMatch.template.name,
                            templateIdTemplate: userTemplateGroupMatch.template.id,
                            groupIdTemplate: userTemplateGroupMatch.group.id,
                        };

                        return userInfoRes;
                    }
                }
            })
        );
        return processedUsers;
    }

    private addMinimalUserGroupToUsersWithoutUserGroup(
        allUsers: PermissionFixerUser[],
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        minimalGroupId: string
    ): PermissionFixerUser[] {
        return allUsers.map(user => {
            const templateGroupMatch = this.findTemplateGroupMatch(completeTemplateGroups, user);
            if (templateGroupMatch == undefined) {
                //template not found -> all roles are invalid except the minimal role
                user.userGroups.push({ id: minimalGroupId, name: "Minimal Group" });
            }
            return { ...user };
        });
    }

    private findTemplateGroupMatch(
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        user: PermissionFixerUser
    ) {
        return completeTemplateGroups.find(template => {
            return user.userGroups.some(
                userGroup => userGroup != undefined && template.group.id == userGroup.id
            );
        });
    }

    private validateUsers(
        allUsers: PermissionFixerUser[],
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        minimalGroupId: string
    ) {
        log.info("Validating users...");
        allUsers.map(user => {
            const templateGroupMatch = this.findTemplateGroupMatch(completeTemplateGroups, user);
            if (templateGroupMatch == undefined) {
                //template not found -> all roles are invalid except the minimal role
                log.error(
                    `Warning: User don't have groups ${user.id} - ${user.name} error adding to minimal group  ${minimalGroupId}`
                );
                throw new Error("User: " + user.username + " don't have valid groups");
            }
        });
    }

    async processUserGroups(
        options: PermissionFixerMetadataConfig,
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        allUsersGroupCheck: PermissionFixerUser[]
    ): Async<PermissionFixerReport> {
        const {
            minimalGroup,
            permissionFixerConfig: { pushFixedUserGroups },
        } = options;
        const response = await this.addLowLevelTemplateGroupToUsersWithoutAny(
            completeTemplateGroups,
            allUsersGroupCheck,
            minimalGroup,
            pushFixedUserGroups
        );

        return response;
    }

    private async addLowLevelTemplateGroupToUsersWithoutAny(
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        allUsersGroupCheck: PermissionFixerUser[],
        minimalGroup: NamedRef,
        pushFixedUserGroups: boolean
    ): Async<PermissionFixerReport> {
        const userIdWithoutGroups: NamedRef[] = this.detectUserIdsWithoutGroups(
            completeTemplateGroups,
            allUsersGroupCheck,
            minimalGroup
        );
        return await this.pushUsersWithoutGroupsWithLowLevelGroup(
            userIdWithoutGroups,
            minimalGroup,
            pushFixedUserGroups
        );
    }

    private detectUserIdsWithoutGroups(
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        allUsersGroupCheck: PermissionFixerUser[],
        minimalGroup: NamedRef
    ): NamedRef[] {
        return _.compact(
            allUsersGroupCheck.map((user): NamedRef | undefined => {
                const templateGroupMatch = completeTemplateGroups.find(template => {
                    return user.userGroups.some(
                        userGroup => userGroup != undefined && template.group.id == userGroup.id
                    );
                });

                if (templateGroupMatch == undefined) {
                    //template not found -> all roles are invalid except the minimal role
                    log.error(
                        `Warning: User don't have groups ${user.id} - ${user.name} adding to minimal group  ${minimalGroup.id}`
                    );
                    const id: NamedRef = { id: user.id, name: user.username };
                    return id;
                }
            })
        );
    }

    private async pushUsersWithoutGroupsWithLowLevelGroup(
        userIdWithoutGroups: NamedRef[],
        minimalGroup: NamedRef,
        pushFixedUserGroups: boolean
    ): Async<PermissionFixerReport> {
        if (userIdWithoutGroups != undefined && userIdWithoutGroups.length > 0) {
            const minimalUserGroup = await this.userGroupRepository.get(minimalGroup.id);
            const userIds = userIdWithoutGroups.map(item => {
                return { id: item.id };
            });
            minimalUserGroup.users.push(...userIds);

            log.info("Pushing fixed users without groups");
            if (!pushFixedUserGroups) {
                return this.getResponse(
                    "Fix user groups is disabled.",
                    userIdWithoutGroups.length,
                    userIdWithoutGroups
                );
            }

            const response = await this.userGroupRepository.save(minimalUserGroup);
            return this.getResponse(response, userIdWithoutGroups.length, userIdWithoutGroups);
        } else {
            return this.getResponse("No users without groups found.", 0, []);
        }
    }

    private getResponse(
        message: string,
        invalidUsersCount: number,
        listOfAffectedUsers: NamedRef[]
    ): PermissionFixerReport {
        log.info("Result: " + message);
        return {
            response: message,
            invalidUsersCount: invalidUsersCount,
            listOfAffectedUsers: listOfAffectedUsers,
        };
    }
}
