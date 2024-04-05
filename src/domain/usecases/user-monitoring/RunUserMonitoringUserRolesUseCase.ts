import { Async } from "domain/entities/Async";
import {
    Item,
    RolesByGroup,
    RolesByRoles,
    RolesByUser,
    TemplateGroupWithAuthorities,
    User,
    UserMonitoringDetails,
    UserRes,
    UsersOptions,
} from "domain/entities/user-monitoring/UserMonitoring";
import { UserRepository } from "domain/repositories/user-monitoring/UserRepository";
import { MetadataRepository } from "domain/repositories/user-monitoring/MetadataRepository";
import log from "utils/log";
import { getUid } from "utils/uid";
import _ from "lodash";

export class RunUserMonitoringUserRolesUseCase {
    constructor(private userRepository: UserRepository, private metadataRepository: MetadataRepository) {}

    async execute(options: UsersOptions): Async<UserMonitoringDetails> {
        const templatesWithAuthorities = await this.metadataRepository.getTemplateAuthorities(options);

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
        return responseUserRolesProcessed;
    }

    async processUserRoles(
        options: UsersOptions,
        completeTemplateGroups: TemplateGroupWithAuthorities[],
        allUsers: User[]
    ): Promise<UserMonitoringDetails> {
        const {
            minimalGroupId,
            minimalRoleId,
            excludedRolesByRole,
            excludedRolesByUser,
            excludedRolesByGroup,
        } = options;

        log.info("Processing users...");
        this.validateUsers(allUsers, completeTemplateGroups, minimalGroupId.id);
        const userinfo: UserRes[] = this.processUsers(
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

            const userToPost: User[] = usersToBeFixed.map(item => {
                return item.fixedUser;
            });
            const userBackup: User[] = usersToBeFixed.map(item => {
                return item.user;
            });

            const response = await this.userRepository.saveUsers(userToPost);

            const result = (await response) ?? "null";
            log.info(`Saving report: ${result}`);

            return {
                invalidUsersCount: usersToBeFixed.length,
                response: result,
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
        allUsers: User[],
        completeTemplateGroups: TemplateGroupWithAuthorities[],
        excludedRolesByRole: RolesByRoles[],
        excludedRolesByGroup: RolesByGroup[],
        excludedRolesByUser: RolesByUser[],
        minimalRoleId: Item
    ): UserRes[] {
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
                    const userInfoRes: UserRes = {
                        user: user,
                        fixedUser: fixedUser,
                        validUserRoles: [{ id: minimalRoleId.id }],
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
                        const userInfoRes: UserRes = {
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
                        const userInfoRes: UserRes = {
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
        allUsers: User[],
        completeTemplateGroups: TemplateGroupWithAuthorities[],
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
}
