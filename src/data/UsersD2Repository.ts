import _ from "lodash";
import { Async } from "domain/entities/Async";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import fs from "fs";
import { UsersOptions, UsersRepository } from "domain/repositories/UsersRepository";
import { User, UserGroup, UserRes, UserRoleAuthority } from "./d2-users/D2Users.types";
import * as CsvWriter from "csv-writer";
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
        const allUsers = await this.getAllUsers(options);
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

        const userinfo: UserRes[] = _.compact(
            allUsers.map(user => {
                const templateGroupMatch = templateGroups.find(template => {
                    return user.userGroups.some(
                        userGroup => userGroup != undefined && template.groupId == userGroup.id
                    );
                });
                const AllGroupMatch = templateGroups.filter(template => {
                    return user.userGroups.some(
                        userGroup => userGroup != undefined && template.groupId == userGroup.id
                    );
                });

                if (templateGroupMatch == undefined) {
                    //template not found
                    log.error(`Warning: User don't have groups ${user.id} - ${user.name}`);

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
                        undefinedUserGroups: true,
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

                    if (AllGroupMatch.length > 1) {
                        log.error(`Warning: User have more than 1 group ${user.id} - ${user.name}`);
                        AllGroupMatch.forEach(element => {
                            log.warn(element.groupId);
                        });
                        const userInfoRes: UserRes = {
                            user: user,
                            fixedUser: fixedUser,
                            validUserRoles: validRoles,
                            actionRequired: false,
                            invalidUserRoles: invalidRoles,
                            userNameTemplate: templateGroupMatch.name ?? "user name not found",
                            templateIdTemplate: templateGroupMatch.templateId ?? "template not found",
                            groupIdTemplate: templateGroupMatch.groupId ?? "group not found",
                            multipleUserGroups: AllGroupMatch.map(item => item.groupId),
                        };

                        //return errors, wa
                        return userInfoRes;
                    } else {
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
                }
            })
        );
        debugger;
        //return userInfoRes
        const date = new Date();
        logErrors(
            userinfo.filter(
                item => !item.actionRequired && (item.undefinedUserGroups || item.multipleUserGroups)
            ),
            { payloadId: `users-errors-${date}` }
        );
        saveInCsv(
            userinfo.filter(
                item => !item.actionRequired && (item.undefinedUserGroups || item.multipleUserGroups)
            ),
            `users-errors-${date}`
        );
        const userActionRequired = userinfo.filter(item => item.actionRequired);

        //Push users to dhis2
        await pushUsers(userActionRequired, { payloadId: `users-${date}` }, this.api);
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
        log.info(`Get metadata: All users IDS: ${userIds.join(", ")}`);

        const responses = await this.api
            .get<Users>(`/users?filter=id:in:[${userIds.join(",")}]&fields=*&paging=false.json`)
            .getData();

        return responses["users"];
    }

    private async getGroups(groupsIds: string[]): Promise<UserGroup[]> {
        log.info(`Get metadata: All groups`);

        const responses = await this.api
            .get<UserGroups>(
                `/userGroups?filter=id:in:[${groupsIds.join(
                    ","
                )}]&fields=id,created,lastUpdated,name,users&paging=false.json`
            )
            .getData();

        return responses["userGroups"];
    }
    private async getAllUsers(options: UsersOptions): Promise<User[]> {
        log.info(`Get metadata: All users: ${options.excludedUsers.join(", ")}`);

        const responses = await this.api
            .get<Users>(
                `/users.json?paging=false&fields=*,userCredentials[*]&filter=id:!in:[${options.excludedUsers.join(
                    ","
                )}]`
            )
            .getData();

        return responses["users"];
    }
}

async function pushUsers(userActionRequired: UserRes[], options: { payloadId: string }, api: D2Api) {
    debugger;

    const userToPost: User[] = userActionRequired.map(item => {
        return item.fixedUser;
    });
    const usersReadyToPost: Users = { users: userToPost };
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
    saveResult(userActionRequired, response);
    return response;
}
function logErrors(userConfigErrors: UserRes[], options: { payloadId: string }) {
    const errorJsonPath = `user-config-json-error-${options.payloadId}.json`;
    log.error(`Save import error: ${errorJsonPath}`);
    fs.writeFileSync(errorJsonPath, JSON.stringify({ userConfigErrors }, null, 4));
}

type Attr =
    | "id"
    | "username"
    | "lastUpdated"
    | "lastLogin"
    | "disabled"
    | "actionRequired"
    | "undefinedGroups"
    | "multipleGroups"
    | "userRoles"
    | "invalidRoles"
    | "validRoles";

type Row = Record<Attr, string>;

const headers: Record<Attr, { title: string }> = {
    id: { title: "User ID" },
    username: { title: "Username" },
    lastUpdated: { title: "LastUpdated" },
    lastLogin: { title: "LastLogin" },
    disabled: { title: "Disabled" },
    actionRequired: { title: "ActionRequired" },
    undefinedGroups: { title: "UndefinedGroups" },
    multipleGroups: { title: "MultipleTemplateGroups" },
    userRoles: { title: "UserRoles" },
    invalidRoles: { title: "InvalidRoles" },
    validRoles: { title: "ValidRoles" },
};

async function saveInCsv(users: UserRes[], filepath: string) {
    const createCsvWriter = CsvWriter.createObjectCsvWriter;
    const csvHeader = _.map(headers, (obj, key) => ({ id: key, ...obj }));
    const csvWriter = createCsvWriter({ path: filepath, header: csvHeader });

    const records = users.map((user): Row => {
        return {
            id: user.user.id,
            username: user.user.userCredentials.username,
            lastUpdated: user.user.userCredentials.lastUpdated,
            lastLogin: user.user.userCredentials.lastLogin,
            disabled: user.user.userCredentials.disabled.toString(),
            actionRequired: user.actionRequired.toString(),
            undefinedGroups: user.undefinedUserGroups?.toString() ?? "",
            multipleGroups: user.multipleUserGroups?.join(", ") ?? "",
            userRoles: user.user.userCredentials.userRoles
                .map(item => {
                    return item.id;
                })
                .join(", "),
            validRoles: user.validUserRoles
                .map(item => {
                    return item.id;
                })
                .join(", "),
            invalidRoles: user.invalidUserRoles
                .map(item => {
                    return item.id;
                })
                .join(", "),
        };
    });

    await csvWriter.writeRecords(records);
}
async function saveResult(userActionRequired: UserRes[], response: UserResponse) {
    log.info(`Saving report (failed push)`);
    const date = -new Date();

    const userToPost: User[] = userActionRequired.map(item => {
        return item.fixedUser;
    });
    const userBeforePost: User[] = userActionRequired.map(item => {
        return item.user;
    });
    const csvErrorFilename = `users-push-error-${date}.csv`;
    const jsonUserFilename = `users-push-error-${date}.json`;

    if (response.status !== "OK") {
        log.error(`Save errors in csv: `);
        await saveInCsv(userActionRequired, `${csvErrorFilename}`);
        log.error(`Save jsons on import error: ${jsonUserFilename}`);
        fs.writeFileSync(jsonUserFilename, JSON.stringify({ response, userToPost }, null, 4));
    } else {
        const jsonBackupUserFilename = `users-backup-error-${date}.json`;
        log.error(`Save pushed users details in csv: ${csvErrorFilename}`);
        await saveInCsv(userActionRequired, `${csvErrorFilename}`);
        log.error(`Save pushed users: ${jsonUserFilename}`);
        fs.writeFileSync(jsonUserFilename, JSON.stringify({ response, userToPost }, null, 4));
        log.error(`Save backup of users: ${jsonBackupUserFilename}`);
        fs.writeFileSync(jsonBackupUserFilename, JSON.stringify({ response, userBeforePost }, null, 4));
    }
}
