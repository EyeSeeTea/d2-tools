import _, { template } from "lodash";
import { Async } from "domain/entities/Async";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import fs from "fs";
import { UsersOptions, UsersRepository } from "domain/repositories/UsersRepository";
import { User, UserResult, UserRoleAuthority } from "./d2-users/D2Users.types";

type Users = { users: User[] };
type UserRoleAuthorities = { userRoles: UserRoleAuthority[] };

type UserResponse = { status: string; typeReports: object[] };

export class UsersD2Repository implements UsersRepository {
    constructor(private api: D2Api) {}
    async checkPermissions(options: UsersOptions): Async<void> {
        const { templates: templateGroups } = options;

        const userTemplateIds = templateGroups.map(template => {
            return template.templateId;
        });
        const userGroupIds = templateGroups.map(template => {
            return template.groupId;
        });
        // const userGroupIds = templates.forEach(template => {template.groupId})
        const allUserTemplates = await this.getUsers(userTemplateIds);
        const allUsers = await this.getAllUsers();
        const userRoles: UserRoleAuthority[] = await this.getAllUserRoles();
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
            debugger;

            const validRoles: UserRoleAuthority[] = _.compact(
                userRoles.map(role => {
                    const authorities = role.authorities.filter(authority => {
                        if (templateAutorities.indexOf(authority) >= 0) return authority;
                    });
                    if (authorities.length == role.authorities.length) {
                        return role;
                    }
                })
            );

            const invalidRoles: UserRoleAuthority[] = _.compact(
                userRoles.map(role => {
                    const authorities = role.authorities.filter(authority => {
                        if (templateAutorities.indexOf(authority) == -1) return authority;
                    });
                    if (authorities.length == role.authorities.length) {
                        return role;
                    }
                })
            );
            item.validRoles = validRoles;
            item.invalidRoles = invalidRoles;
        });
        debugger; //todo: check the workflow from here:
        const userinfo: UserResult[] = allUsers.map(user => {
            const templateUserGroup: string[] = userGroupIds.filter(templateUserGroup => {
                const value = user.userGroups.filter(userGroupItem => {
                    userGroupItem.id == templateUserGroup;
                });
                return value;
            });

            const templateMatch = templateGroups.find(template => {
                return user.userGroups.some(userGroup => template.groupId == userGroup.id);
            });

            if (templateMatch == undefined) {
                //template not found
                return { user, validRoles: [], invalidRoles: user.userCredentials.userRoles };
            } else {
                const userTemplate = allUserTemplates.filter(item => {
                    return item.id == templateMatch?.templateId;
                });
                const templateRoles = userTemplate[0]!.userCredentials.userRoles.map(item => {
                    return item.id;
                });
                const validRoles = user.userCredentials.userRoles.filter(userRole => {
                    return templateRoles.indexOf(userRole.id) >= 0;
                });
                const invalidRoles = user.userCredentials.userRoles.filter(userRole => {
                    return templateRoles.indexOf(userRole.id) == -1;
                });

                return { user, validRoles: validRoles, invalidRoles: invalidRoles };
            }
        });
        const usersToPost: User[] = _.compact(
            userinfo.map(item => {
                if (item.invalidRoles.length == 0) {
                    item.user.userCredentials.userRoles = item.validRoles;
                    return item.user;
                }
            })
        );

        //Push users to dhis2
        const usersReadytoPost: Users = { users: usersToPost };
        const date = new Date();
        await pushUsers(usersReadytoPost, { payloadId: `users-${date}` }, this.api);
    }

    async getAllUserRoles(): Promise<UserRoleAuthority[]> {
        log.info(`Get metadata: all roles:`);

        const responses = await this.api
            .get<UserRoleAuthorities>(`/userRoles.json?paging=false&fields=id,name,authorities`)
            .getData();

        return responses.userRoles;
    }

    private async getUsers(userIds: string[]): Promise<User[]> {
        log.info(`Get metadata: users IDS: ${userIds.join(", ")}`);

        const responses = await this.api
            .get<Users>(`/users?filter=id:in:[${userIds.join(",")}]&fields=*&paging=false.json`)
            .getData();

        return responses["users"];
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
    const response: UserResponse = await api
        .post<UserResponse>("/users", { async: false }, { users: usersReadyToPost })
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
