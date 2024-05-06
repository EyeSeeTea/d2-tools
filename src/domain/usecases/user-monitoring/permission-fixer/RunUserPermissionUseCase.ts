import { PermissionFixerConfigRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerConfigRepository";
import { UserMonitoringRepository } from "domain/repositories/user-monitoring/common/UserMonitoringRepository";
import { PermissionFixerTemplateRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerTemplateRepository";
import { getUid } from "utils/uid";
import _ from "lodash";
import { PermissionFixerUserOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserOptions";
import { RolesByRoles } from "domain/entities/user-monitoring/permission-fixer/RolesByRoles";
import { RolesByGroup } from "domain/entities/user-monitoring/permission-fixer/RolesByGroup";
import { RolesByUser } from "domain/entities/user-monitoring/permission-fixer/RolesByUser";
import { Ref } from "domain/entities/Base";
import { UserMonitoringUser } from "domain/entities/user-monitoring/common/UserMonitoringUser";
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

export class RunUserPermissionUseCase {
    constructor(
        private configRepository: PermissionFixerConfigRepository,
        private reportRepository: PermissionFixerReportRepository,
        private templateRepository: PermissionFixerTemplateRepository,
        private userGroupRepository: PermissionFixerUserGroupRepository,
        private userRepository: UserMonitoringRepository
    ) {}

    async execute() {
        const options = await this.configRepository.get();

        const userTemplateIds = options.templates.map(template => {
            return template.template.id;
        });

        const allUserTemplates = await this.userRepository.getAllUsers(userTemplateIds, false);
        //usergroups
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
            options.pushReport &&
            (finalUserGroup.invalidUsersCount > 0 || finalUserRoles.invalidUsersCount > 0)
        ) {
            log.info(`Sending user-monitoring user-permissions report results`);
            await this.reportRepository.save(options.pushProgramId.id, finalUserGroup, finalUserRoles);
        } else {
            log.info(`Nothing to report. No invalid users found.`);
        }
    }

    async processUserRoles(
        options: PermissionFixerUserOptions,
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        allUsers: UserMonitoringUser[]
    ): Promise<PermissionFixerExtendedReport> {
        const {
            minimalGroupId,
            minimalRoleId,
            testOnly,
            excludedRolesByRole,
            excludedRolesByUser,
            excludedRolesByGroup,
        } = options;

        log.info("Processing users...");
        this.validateUsers(allUsers, completeTemplateGroups, minimalGroupId.id);
        const userinfo: UserMonitoringUserResponse[] = this.processUsers(
            allUsers,
            completeTemplateGroups,
            excludedRolesByRole,
            excludedRolesByGroup,
            excludedRolesByUser,
            minimalRoleId
        );

        //users without user groups
        const usersWithErrorsInGroups = userinfo.filter(item => item.undefinedUserGroups);
        //todo: Maybe add throw exception?
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
                eventid: "",
                usersBackup: [],
                usersFixed: [],
                userProcessed: [],
                listOfAffectedUsers: [],
            };
        } else {
            log.info(usersToBeFixed.length + " users will be fixed");

            log.info(usersToBeFixed.length + " users will be pushed");

            log.info("Users processed. Starting push...");

            const date = new Date()
                .toLocaleString()
                .replace(" ", "-")
                .replace(":", "-")
                .replace("/", "-")
                .replace("/", "-")
                .replace("\\", "-");
            const eventUid = getUid(date);

            const userToPost: UserMonitoringUser[] = usersToBeFixed.map(item => {
                return item.fixedUser;
            });
            const userBackup: UserMonitoringUser[] = usersToBeFixed.map(item => {
                return item.user;
            });

            const response = !testOnly
                ? (await this.userRepository.saveUsers(userToPost)) ?? "Empty response"
                : "Test_only_mode";

            return {
                invalidUsersCount: usersToBeFixed.length,
                response: await response,
                eventid: eventUid,
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
        allUsers: UserMonitoringUser[],
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        excludedRolesByRole: RolesByRoles[],
        excludedRolesByGroup: RolesByGroup[],
        excludedRolesByUser: RolesByUser[],
        minimalRoleId: Ref
    ): UserMonitoringUserResponse[] {
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
                    fixedUser.userCredentials.userRoles = [{ id: minimalRoleId.id }];
                    fixedUser.userRoles = [{ id: minimalRoleId.id }];
                    const userInfoRes: UserMonitoringUserResponse = {
                        user: user,
                        fixedUser: fixedUser,
                        validUserRoles: [{ id: minimalRoleId.id, name: "Minimal Role" }],
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

                    if (AllGroupMatch.length > 1) {
                        log.debug(`Debug: User have more than 1 group ${user.id} - ${user.name}`);
                        const userInfoRes: UserMonitoringUserResponse = {
                            user: user,
                            fixedUser: fixedUser,
                            validUserRoles: userValidRoles,
                            actionRequired: userInvalidRoles.length > 0,
                            invalidUserRoles: userInvalidRoles,
                            userNameTemplate: templateGroupMatch!.template.name,
                            templateIdTemplate: templateGroupMatch!.template.id,
                            groupIdTemplate: templateGroupMatch!.group.id,
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
                            userNameTemplate: templateGroupMatch!.template.name,
                            templateIdTemplate: templateGroupMatch!.template.id,
                            groupIdTemplate: templateGroupMatch!.group.id,
                        };

                        return userInfoRes;
                    }
                }
            })
        );
        return processedUsers;
    }

    private validateUsers(
        allUsers: UserMonitoringUser[],
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        minimalGroupId: string
    ) {
        allUsers.map(user => {
            const templateGroupMatch = completeTemplateGroups.find(template => {
                return user.userGroups.some(
                    userGroup => userGroup != undefined && template.group.id == userGroup.id
                );
            });
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
        options: PermissionFixerUserOptions,
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        allUsersGroupCheck: UserMonitoringUser[]
    ): Promise<PermissionFixerReport> {
        const { minimalGroupId, testOnly } = options;

        const response = await this.addLowLevelTemplateGroupToUsersWithoutAny(
            completeTemplateGroups,
            allUsersGroupCheck,
            minimalGroupId,
            testOnly
        );

        return response;
    }

    private async addLowLevelTemplateGroupToUsersWithoutAny(
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        allUsersGroupCheck: UserMonitoringUser[],
        minimalGroupId: NamedRef,
        testOnly: boolean
    ): Promise<PermissionFixerReport> {
        const userIdWithoutGroups: NamedRef[] = this.detectUserIdsWithoutGroups(
            completeTemplateGroups,
            allUsersGroupCheck,
            minimalGroupId
        );
        return await this.pushUsersWithoutGroupsWithLowLevelGroup(
            userIdWithoutGroups,
            minimalGroupId,
            testOnly
        );
    }

    private detectUserIdsWithoutGroups(
        completeTemplateGroups: PermissionFixerTemplateGroupExtended[],
        allUsersGroupCheck: UserMonitoringUser[],
        minimalGroupId: NamedRef
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
                        `Warning: User don't have groups ${user.id} - ${user.name} adding to minimal group  ${minimalGroupId}`
                    );
                    const id: NamedRef = { id: user.id, name: user.username };
                    return id;
                }
            })
        );
    }

    private async pushUsersWithoutGroupsWithLowLevelGroup(
        userIdWithoutGroups: NamedRef[],
        minimalGroupId: NamedRef,
        testOnly: boolean
    ): Promise<PermissionFixerReport> {
        if (userIdWithoutGroups != undefined && userIdWithoutGroups.length > 0) {
            const minimalUserGroup = await this.userGroupRepository.getByIds([minimalGroupId.id]);
            const userIds = userIdWithoutGroups.map(item => {
                return { id: item.id };
            });
            minimalUserGroup[0]?.users.push(...userIds);

            log.info("Pushing fixed users without groups");
            if (testOnly) {
                log.info("Test only mode. No changes will be saved to the database.");
                return {
                    response: "Test only mode",
                    invalidUsersCount: userIdWithoutGroups.length,
                    listOfAffectedUsers: userIdWithoutGroups,
                };
            } else {
                const response = await this.userGroupRepository.save(minimalUserGroup[0]!);

                log.info("Result: " + response);
                return {
                    response: response,
                    invalidUsersCount: userIdWithoutGroups.length,
                    listOfAffectedUsers: userIdWithoutGroups,
                };
            }
        } else {
            return { response: "", invalidUsersCount: 0, listOfAffectedUsers: [] };
        }
    }
}
