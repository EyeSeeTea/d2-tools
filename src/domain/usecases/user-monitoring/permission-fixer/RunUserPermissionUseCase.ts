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

type RunUserPermissionResponse = {
    message: string;
    allUsersToProcessGroups: PermissionFixerUser[];
    allUsersToProcessRoles: PermissionFixerUser[];
    excludedUsers: PermissionFixerUser[];
    userTemplates: PermissionFixerUser[];
    rolesReport?: PermissionFixerExtendedReport;
    groupsReport?: PermissionFixerReport;
};

export class RunUserPermissionUseCase {
    constructor(
        private configRepository: PermissionFixerConfigRepository,
        private reportRepository: PermissionFixerReportRepository,
        private templateRepository: PermissionFixerTemplateRepository,
        private userGroupRepository: PermissionFixerUserGroupRepository,
        private userRepository: PermissionFixerUserRepository,
        private programRepository: UserMonitoringProgramRepository
    ) {}

    async execute(): Async<RunUserPermissionResponse> {
        const options = await this.configRepository.get();

        const programMetadata = await this.programRepository.get(options.pushProgram.id);
        if (!programMetadata) {
            throw new Error("Metadata not found in the server. Check the program id.");
        }
        const userTemplateIds = options.templates.map(template => {
            return template.template.id;
        });
        const allUser = await this.userRepository.getAllUsers();

        const excludedUsersId = options.excludedUsers.map(excludedUser => excludedUser.id);

        const excludedUsers = allUser.filter(user => {
            return excludedUsersId.includes(user.id);
        });

        const allUserTemplates = allUser.filter(user => {
            return userTemplateIds.includes(user.id);
        });

        const allUserTemplatesId = allUserTemplates.map(templateUser => templateUser.id);

        log.info(JSON.stringify(allUser));
        //excluded users and template users to the proccess
        const usersToProcessGroups = allUser.filter(user => {
            log.info(user.username);
            return (
                excludedUsersId.includes(user.id) === false && allUserTemplatesId.includes(user.id) === false
            );
        });

        const templatesWithAuthorities = await this.templateRepository.getTemplateAuthorities(
            options,
            allUserTemplates
        );

        options.excludedUsers.map(item => {
            return item.id;
        }),
            true;

        log.info(`Processing userGroups (all users must have at least one template user group)`);
        log.info(JSON.stringify(options));
        const responseUserGroups = await this.processUserGroups(
            options,
            templatesWithAuthorities,
            usersToProcessGroups
        );

        //todo: second call, to have the users in the last version after update the missing usergroups, review if it is required
        log.info(`Run user Role monitoring`);
        const allUserAfterProccessgGroups = await this.userRepository.getAllUsers();
        const usersToProcessRoles = allUserAfterProccessgGroups.filter(user => {
            log.info(JSON.stringify(allUserTemplatesId));
            return (
                excludedUsersId.includes(user.id) === false && allUserTemplatesId.includes(user.id) === false
            );
        });

        log.info("process 2roles" + usersToProcessRoles.length);
        const responseUserRolesProcessed = await this.processUserRoles(
            options,
            templatesWithAuthorities,
            usersToProcessRoles
        );
        log.info(JSON.stringify(responseUserRolesProcessed));
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
            log.info(JSON.stringify(finalUserGroup));
            log.info(JSON.stringify(finalUserRoles));
            const response = await this.reportRepository.save(
                programMetadata,
                finalUserGroup,
                finalUserRoles
            );
            log.info(JSON.stringify(response));
            log.info("---------------------------------------");

            return {
                message: response,
                allUsersToProcessGroups: usersToProcessGroups,
                allUsersToProcessRoles: usersToProcessGroups,
                excludedUsers: excludedUsers,
                userTemplates: allUserTemplates,
                groupsReport: finalUserGroup,
                rolesReport: finalUserRoles,
            };
        } else {
            log.info(`Nothing to report. No invalid users found.`);
            return {
                message: "Nothing to report. No invalid users found.",
                allUsersToProcessGroups: usersToProcessGroups,
                allUsersToProcessRoles: usersToProcessRoles,
                excludedUsers: excludedUsers,
                userTemplates: allUserTemplates,
                groupsReport: undefined,
                rolesReport: undefined,
            };
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
            log.info("forceMinimalGroupForUsersWithoutGroup is disabled.");
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

        log.info("Preprocess users..." + JSON.stringify(options));
        log.info("Preprocess users..." + allUsers.length);
        const allPreProcessedUsers = this.preProcessUsers(
            allUsers,
            completeTemplateGroups,
            forceMinimalGroupForUsersWithoutGroup,
            minimalGroup.id
        );

        log.info("Validating users..." + allPreProcessedUsers.length);
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
        log.info("Lenght" + allUsers.length);
        allUsers.map(user => {
            log.info(user.username);
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

            log.info("Pushing fixed users without groups");
            if (!pushFixedUserGroups) {
                return this.getResponse(
                    "Fix user groups is disabled.",
                    userIdWithoutGroups.length,
                    userIdWithoutGroups
                );
            }

            const response = await this.userGroupRepository.save(minimalUserGroup, userIds);
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
