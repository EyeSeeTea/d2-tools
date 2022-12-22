import _ from "lodash";
import { Async } from "domain/entities/Async";
import { D2Api, PostOptions } from "types/d2-api";
import log from "utils/log";
import fs from "fs";
import { UsersOptions, UsersRepository } from "domain/repositories/UsersRepository";
import { User, UserGroup, UserRes, UserResult, UserRoleAuthority } from "./d2-users/D2Users.types";
import { runMetadata } from "./dhis2-utils";
type Users = { users: User[] };
type UserGroups = { userGroups: UserGroup[] };
type UserRoleAuthorities = { userRoles: UserRoleAuthority[] };

type UserResponse = { status: string; typeReports: object[] };

export class UsersD2Repository implements UsersRepository {
    constructor(private api: D2Api) {}

    async checkPermissions(options: UsersOptions): Promise<Async<void>> {
        const { templates: templateGroups } = options;

        const userTemplateIds = templateGroups.map(template => {
            return template.templateId;
        });
        const userGroupIds = templateGroups.map(template => {
            return template.groupId;
        });

        const allUserTemplates = await this.getUsers(userTemplateIds);
        const allGroupTemplates = await this.getGroups(userGroupIds);
        debugger;
        const allUsers = await this.getAllUsers();
        const userRoles: UserRoleAuthority[] = await this.getAllUserRoles(options);
        const validateRoles = userRoles.filter(role => {
            return role.authorities.length == 0;
        });
        if (validateRoles.length > 0) {
            validateRoles.forEach(role => {
                log.error(`Role ${role.id} - ${role.name} has no authorities`);
            });
            throw new Error("Roles with no authorities are not allowed");
        }
        templateGroups.map(item => {
            const user = allUserTemplates.find(template => {
                return template.id == item.templateId;
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
                    if (authorities.length == role.authorities.length) {
                        return role;
                    }
                })
            );

            const invalidRolesByAuthority: UserRoleAuthority[] = _.compact(
                userRoles.map(role => {
                    const authorities = role.authorities.filter(authority => {
                        if (templateAutorities.indexOf(authority) == -1) return authority;
                    });
                    if (authorities.length == role.authorities.length) {
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

            item.validRolesByAuthority = validRolesByAuthority;
            item.invalidRolesByAuthority = invalidRolesByAuthority;
            item.validRolesById = validRoles;
            item.invalidRolesById = invalidRoles;
            item.name = allUserTemplates.find(template => {
                return template.id == item.templateId;
            })?.name;
        });

        const userinfo: UserRes[] = allUsers.map(user => {
            const templateGroupMatch = templateGroups.find(template => {
                return user.userGroups.some(
                    userGroup => userGroup != undefined && template.groupId == userGroup.id
                );
            });

            if (templateGroupMatch == undefined) {
                //template not found
                const fixedUser = JSON.parse(JSON.stringify(user));
                fixedUser.userCredentials.userRoles = [];
                const userInfoRes: UserRes = {
                    user: user,
                    fixedUser: fixedUser,
                    validUserRoles: [],
                    actionRequired: user.userCredentials.userRoles.length > 0,
                    invalidUserRoles: user.userCredentials.userRoles,
                    userNameTemplate: "user name not found",
                    templateIdTemplate: "template not found",
                    groupIdTemplate: "group not found",
                };
                return userInfoRes;
            } else {
                const validRoles = user.userCredentials.userRoles.filter(userRole => {
                    return templateGroupMatch?.validRolesById.indexOf(userRole.id) >= 0;
                });
                const invalidRoles = user.userCredentials.userRoles.filter(userRole => {
                    return templateGroupMatch?.invalidRolesById.indexOf(userRole.id) >= 0;
                });

                //clone user
                const fixedUser = JSON.parse(JSON.stringify(user));
                fixedUser.userCredentials.userRoles = validRoles;
                const userInfoRes: UserRes = {
                    user: user,
                    fixedUser: fixedUser,
                    validUserRoles: validRoles,
                    actionRequired: invalidRoles.length > 0,
                    invalidUserRoles: invalidRoles,
                    userNameTemplate: templateGroupMatch.name ?? "user name not found",
                    templateIdTemplate: templateGroupMatch.templateId ?? "template not found",
                    groupIdTemplate: templateGroupMatch.groupId ?? "group not found",
                };

                //return errors, wa
                return userInfoRes;
            }
        });
        debugger;
        //return userInfoRes
        const userActionRequired = userinfo.filter(item => item.actionRequired);
        const userToPost: User[] = userActionRequired.map(item => {
            return item.fixedUser;
        });

        //Push users to dhis2
        const usersReadytoPost: Users = { users: userToPost };
        const date = new Date();
        await pushUsers(usersReadytoPost, { payloadId: `users-${date}` }, this.api);
    }

    async getAllUserRoles(options: UsersOptions): Promise<UserRoleAuthority[]> {
        log.info(`Get metadata: all roles:`);
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

        /* 
        const userActionRequired = userInfoRes.filter(item => item.actionRequired)

        //todo fix user update
        const userCSV: UserCSV[] = userActionRequired.map(async item => {

            const options: Partial<PostOptions> = { async: false };
            const response = await runMetadata(this.api.metadata.post({ "users": item.fixedUser }, options));

            item.networkRes = response.status
            if (response.status !== "OK") {
                console.error(JSON.stringify(response.typeReports, null, 4));
            }
            item.updated = true
            return {
                id: item.fixedUser.id,
                username: item.fixedUser.username,
                email: item.fixedUser.email,
                displayName: item.fixedUser.displayName,
                userGroups: item.fixedUser.userGroups.join(","),
                lastUpdatedBy: item.fixedUser.lastUpdatedBy.username,
                createdBy: item.fixedUser.createdBy.username,
                userType: item.groupTemplate,
                templateUser: item.userTemplate,
                validUserRoles: item.validUserRoles,
                invalidUserRoles: item.invalidUserRoles,
                networkRes: item.networkRes ?? "-"
            }

        }) */

        //todo write csv
    }

    private async getUsers(userIds: string[]): Promise<User[]> {
        log.info(`Get metadata: users IDS: ${userIds.join(", ")}`);

        const responses = await this.api
            .get<Users>(`/users?filter=id:in:[${userIds.join(",")}]&fields=*&paging=false.json`)
            .getData();

        return responses["users"];
    }

    private async getGroups(groupsIds: string[]): Promise<UserGroup[]> {
        log.info(`Get metadata: groups IDS: ${groupsIds.join(", ")}`);

        const responses = await this.api
            .get<UserGroups>(
                `/userGroups?filter=id:in:[${groupsIds.join(
                    ","
                )}]&fields=id,created,lastUpdated,name,users&paging=false.json`
            )
            .getData();

        return responses["userGroups"];
    }
    private async getAllUsers(): Promise<User[]> {
        log.info(`Get metadata: all users:`);

        const responses = await this.api
            .get<Users>(`/users.json?paging=false&fields=*,userCredentials[*]`)
            .getData();

        return responses["users"];
    }
}

async function pushUsers(usersReadyToPost: Users, options: { payloadId: string }, api: D2Api) {
    debugger;
    const response: UserResponse = await api
        .post<UserResponse>("/metadata", { async: false }, usersReadyToPost)
        .getData()
        .catch(err => {
            if (err?.response?.data) {
                return err.response.data as UserResponse;
            } else {
                return { status: "ERROR", typeReports: [] };
            }
        });
    debugger;
    if (response.status !== "OK") {
        const errorJsonPath = `programs-import-error-${options.payloadId}.json`;
        log.error(`Save import error: ${errorJsonPath}`);
        fs.writeFileSync(errorJsonPath, JSON.stringify({ response, usersReadyToPost }, null, 4));
        return response;
    } else {
        return response;
    }
}
