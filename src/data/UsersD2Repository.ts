import { Async } from "domain/entities/Async";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import fs from "fs";
import {
    Item,
    RolesByGroup,
    RolesByRoles,
    RolesByUser,
    TemplateGroup,
    TemplateGroupWithAuthorities,
    UsersOptions,
    UsersRepository,
} from "domain/repositories/UsersRepository";
import {
    DataElement,
    EventDataValue,
    IdItem,
    Program,
    ProgramMetadata,
    ProgramStage,
    ProgramStageDataElement,
    User,
    UserGroup,
    UserRes,
    UserRole,
    UserRoleAuthority,
} from "./d2-users/D2Users.types";
import * as CsvWriter from "csv-writer";
import { getUid } from "utils/uid";
import { FileUploadParameters, Files } from "@eyeseetea/d2-api/api/files";
import _ from "lodash";

//users without template group
const dataelement_invalid_users_count_code = "ADMIN_invalid_users_groups_count_1_Events";
//users with invald roles based on the upper level of the template group
const dataelement_invalid_roles_count_code = "ADMIN_invalid_users_roles_count_2_Events";
const dataelement_users_pushed_code = "ADMIN_user_pushed_control_Events";
const dataelement_file_invalid_users_file_code = "ADMIN_invalid_users_backup_3_Events";
const dataelement_file_valid_users_file_code = "ADMIN_valid_users_backup_4_Events";

const date = new Date()
    .toLocaleString()
    .replace(" ", "-")
    .replace(":", "-")
    .replace(":", "-")
    .replace("/", "-")
    .replace("/", "-")
    .replace("\\", "-");
const csvErrorFilename = `${date}-users-bakkup`;
const filenameErrorOnPush = `${date}-users-push-error`;
const csvPushedFilename = `${date}-users-pushed`;
const filenameUsersPushed = `${date}-users-pushed.json`;
const filenameUserBackup = `${date}-users-update-backup.json`;

type Users = { users: User[] };
type Programs = { programs: Program[] };
type UserGroups = { userGroups: UserGroup[] };
type UserRoleAuthorities = { userRoles: UserRoleAuthority[] };
type UserResponse = { status: string; typeReports: object[] };

export class UsersD2Repository implements UsersRepository {
    constructor(private api: D2Api) {}

    async checkPermissions(options: UsersOptions): Promise<Async<void>> {
        const {
            templates: templateGroups,
            pushReport: pushReport,
            pushProgramId: pushProgramId,
            minimalGroupId: minimalGroupId,
            minimalRoleId: minimalRoleId,
            excludedRoles: excludedRoles,
            excludedUsers: excludedUsers,
            excludedRolesByRole: excludedRolesByRole,
            excludedRolesByUser: excludedRolesByUser,
            excludedRolesByGroup: excludedRolesByGroup,
        } = options;

        const excludedUsersIds = excludedUsers.map(item => {
            return item.id;
        });
        const userRoles: UserRoleAuthority[] = await this.getAllUserRoles(options);
        log.info("Validating roles...");
        this.validateAuths(userRoles, excludedRoles);

        const completeTemplateGroups = await this.fillAuthorities(templateGroups, userRoles);

        log.info("Validating users and groups...");
        const allUsersGroupCheck = await this.getAllUsers(excludedUsersIds);

        //Add the low level template group to the users without template group
        await this.addLowLevelGroupToUsersWithoutTemplate(
            completeTemplateGroups,
            allUsersGroupCheck,
            minimalGroupId
        );

        //fix user roles based on its groups
        const allUsers = await this.getAllUsers(excludedUsersIds);

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

        log.info("Users processed. Starting push...");
        //return userInfoRes
        const date = new Date()
            .toLocaleString()
            .replace(" ", "-")
            .replace(":", "-")
            .replace("/", "-")
            .replace("/", "-")
            .replace("\\", "-");
        const eventUid = getUid(date);

        //users without user groups
        const usersWithErrorsInGroups = userinfo.filter(item => item.undefinedUserGroups);

        //users with action required
        const usersToBeFixed = userinfo.filter(item => item.actionRequired);

        const userActionRequired = userinfo.filter(item => item.actionRequired);
        //save errors in user configs
        if (usersToBeFixed.length > 0) {
            log.info(usersToBeFixed.length + " users will be fixed");

            log.info(usersToBeFixed.length + " users will be pushed");
            if (userActionRequired.length > 0) {
                const userToPost: User[] = userActionRequired.map(item => {
                    return item.fixedUser;
                });
                const response = await pushUsers(userToPost, this.api);
                const result = response?.status ?? "null";
                log.info(`Saving report: ${result}`);
                log.info(`Saving report: ${response.typeReports}`);
                if (pushReport) {
                    const eventid = getUid(date);
                    log.info("Report event id:" + eventid);

                    const userFixed: User[] = userActionRequired.map(item => {
                        return item.fixedUser;
                    });
                    const userBackup: User[] = userActionRequired.map(item => {
                        return item.user;
                    });
                    const userFixedId = await saveFileResource(
                        JSON.stringify(userFixed),
                        filenameUsersPushed,
                        this.api
                    );
                    const userBackupId = await saveFileResource(
                        JSON.stringify(userBackup),
                        filenameUserBackup,
                        this.api
                    );

                    saveUserChangesBakup(usersToBeFixed, eventid);
                    saveInJsonFormat(
                        JSON.stringify({ usersWithErrors: usersWithErrorsInGroups }, null, 4),
                        `${date}-groups-pushed`
                    );
                    saveInCsv(usersWithErrorsInGroups, `${date}-groups-pushed`);

                    const response = await pushReportToDhis(
                        usersWithErrorsInGroups.length.toString(),
                        usersToBeFixed.length.toString(),
                        result,
                        userFixedId,
                        userBackupId,
                        this.api,
                        pushProgramId.id,
                        eventUid
                    );

                    if (response?.status != "OK") {
                        await saveUserErrors(userActionRequired, eventUid);
                    }
                }
            }
        }
    }
    private async addLowLevelGroupToUsersWithoutTemplate(
        completeTemplateGroups: TemplateGroupWithAuthorities[],
        allUsersGroupCheck: User[],
        minimalGroupId: Item
    ) {
        const userIdWithoutGroups: IdItem[] = this.detectUserIdsWithoutGroups(
            completeTemplateGroups,
            allUsersGroupCheck,
            minimalGroupId
        );

        log.info("Pushing fixed users without groups");
        await this.pushUsersWithoutGroupsWithLowLevelGroup(userIdWithoutGroups, minimalGroupId);
    }
    detectUserIdsWithoutGroups(
        completeTemplateGroups: TemplateGroupWithAuthorities[],
        allUsersGroupCheck: User[],
        minimalGroupId: Item
    ): IdItem[] {
        return _.compact(
            allUsersGroupCheck.map(user => {
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
                    const id: IdItem = { id: user.id };
                    return id;
                }
            })
        );
    }

    private async fillAuthorities(
        templateGroups: TemplateGroup[],
        userRoles: UserRoleAuthority[]
    ): Promise<TemplateGroupWithAuthorities[]> {
        const userTemplateIds = templateGroups.map(template => {
            return template.template.id;
        });

        const allUserTemplates = await this.getUsers(userTemplateIds);
        //todo: I want to do const templatefilled = templateGroup.map(...) but it didnt work
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

    async pushUsersToGroup(minimalUserGroup: UserGroup[], userIdWithoutGroups: IdItem[]) {
        if (userIdWithoutGroups != undefined && userIdWithoutGroups.length > 0) {
            minimalUserGroup[0]?.users.push(...userIdWithoutGroups);
            try {
                const response = await this.api.models.userGroups.put(minimalUserGroup[0]!).getData();
                response.status == "OK"
                    ? log.info("Users added to minimal group")
                    : log.error("Error adding users to minimal group");
                log.info(JSON.stringify(response.response));

                return response.status;
            } catch (error) {
                console.debug(error);
                return "ERROR";
            }
        }
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
                )}]&fields=id,created,lastUpdated,name,users,*&paging=false.json`
            )
            .getData();

        return responses["userGroups"];
    }

    private async pushUsersWithoutGroupsWithLowLevelGroup(
        userIdWithoutGroups: IdItem[],
        minimalGroupId: Item
    ) {
        if (userIdWithoutGroups.length > 0) {
            const minimalUserGroup = await this.getGroups([minimalGroupId.id]);
            await this.pushUsersToGroup(minimalUserGroup, userIdWithoutGroups);
        }
    }

    private async getAllUsers(excludedUsers: string[]): Promise<User[]> {
        log.info(`Get metadata: All users except: ${excludedUsers.join(",")}`);

        const responses = await this.api
            .get<Users>(
                `/users.json?paging=false&fields=*,userCredentials[*]&filter=id:!in:[${excludedUsers.join(
                    ","
                )}]`
            )
            .getData();

        return responses["users"];
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
async function pushUsers(userToPost: User[], api: D2Api) {
    log.info("Push users to dhis2");

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
    return response;
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
    const csvWriter = createCsvWriter({ path: filepath + ".csv", header: csvHeader });

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
            userRoles: JSON.stringify(user.user.userRoles),
            validRoles: JSON.stringify(user.validUserRoles),
            invalidRoles: JSON.stringify(user.invalidUserRoles),
        };
    });

    await csvWriter.writeRecords(records);
}

async function saveUserChangesBakup(userActionRequired: UserRes[], eventid: string) {
    const userToPost: User[] = userActionRequired.map(item => {
        return item.fixedUser;
    });
    const userBeforePost: User[] = userActionRequired.map(item => {
        return item.user;
    });

    log.error(`Save pushed users details in csv: ${csvPushedFilename}`);
    await saveInCsv(userActionRequired, `${csvPushedFilename}`);
    log.error(`Save pushed users: ${filenameUsersPushed}`);
    await saveInJsonFormat(JSON.stringify({ userToPost }, null, 4), filenameUsersPushed);
    log.error(`Save backup of users: ${filenameUserBackup}`);
    await saveInJsonFormat(JSON.stringify({ userBeforePost }, null, 4), filenameUserBackup);
}

async function saveUserErrors(userActionRequired: UserRes[], eventid: string) {
    const userToPost: User[] = userActionRequired.map(item => {
        return item.fixedUser;
    });
    log.error(`Save jsons on import error: ${filenameErrorOnPush}`);
    await saveInJsonFormat(JSON.stringify({ eventid, userToPost }, null, 4), filenameErrorOnPush);
    log.error(`Save errors in csv: `);
    await saveInCsv(userActionRequired, `${csvErrorFilename}`);
}

function saveInJsonFormat(content: string, file: string) {
    fs.writeFileSync(file + ".json", content);
    log.info(`Json saved in ${file}`);
    return file;
}

async function getProgram(api: D2Api, programUid: string): Promise<Program[]> {
    log.info(`Get metadata: Program metadata: ${programUid}`);

    const responses = await api
        .get<Programs>(
            `/programs?filter=id:eq:${programUid}&fields=id,organisationUnits[id],programStages[id,programStageDataElements[id,dataElement[id,name,code]]&paging=false.json`
        )
        .getData();

    return responses.programs;
}

export async function saveFileResource(jsonString: string, name: string, api: D2Api): Promise<string> {
    const jsonBlob = Buffer.from(jsonString, "utf-8");

    const files = new Files(api);

    const form: FileUploadParameters = {
        id: getUid(name),
        name: name,
        data: jsonBlob,
        ignoreDocument: true,
        domain: "DATA_VALUE",
    };
    const response = await files.saveFileResource(form).getData();
    const fileresourceId = response;
    return fileresourceId;
}
async function pushReportToDhis(
    usersWithErrors: string,
    usersToBeFixed: string,
    status: string,
    userFixedFileResourceId: string,
    userBackupFileResourceid: string,
    api: D2Api,
    pushProgramId: string,
    eventUid: string
) {
    log.info(`Create and Pushing report to DHIS2`);
    const responseProgram = await getProgram(api, pushProgramId);

    const programs = responseProgram[0] ?? undefined;

    if (programs === undefined) {
        log.error(`Program ${pushProgramId} not found`);
        return;
    }
    const programStage: ProgramStage | undefined = programs.programStages[0];
    //todo fix orgunit.id
    const orgunitstring = JSON.stringify(programs.organisationUnits[0]);
    const orgUnit: { id: string } = JSON.parse(orgunitstring);
    const orgUnitId: string = orgUnit.id;

    if (programStage === undefined) {
        log.error(`Programstage ${pushProgramId} not found`);
        return;
    }

    if (orgUnitId === undefined) {
        log.error(`Organisation Unit ${pushProgramId} not found`);
        return;
    }

    const programStageDataElements: ProgramStageDataElement[] = programStage.programStageDataElements;
    //strange map behaviour
    const dataElements: DataElement[] = programStageDataElements.map(item => {
        return item.dataElement;
    });
    /*     const dataElements: string[] = programStageDataElements.map(item => {
        return item.dataElement;
    }); */

    const program: ProgramMetadata = {
        id: pushProgramId,
        programStageId: programStage.id,
        dataElements: dataElements,
        orgUnitId: orgUnitId,
    };
    const dataValues: EventDataValue[] = program.dataElements
        .map(item => {
            switch (item.code) {
                case dataelement_invalid_users_count_code:
                    return { dataElement: item.id, value: usersWithErrors };
                case dataelement_invalid_roles_count_code:
                    return { dataElement: item.id, value: usersToBeFixed };
                case dataelement_file_invalid_users_file_code:
                    return { dataElement: item.id, value: userFixedFileResourceId };
                case dataelement_file_valid_users_file_code:
                    return { dataElement: item.id, value: userBackupFileResourceid };
                case dataelement_users_pushed_code:
                    return { dataElement: item.id, value: status };
                default:
                    return { dataElement: "", value: "" };
            }
        })
        .filter(dataValue => dataValue.dataElement !== "");

    if (dataValues.length == 0) {
        log.info(`No data elements found`);
        return;
    }
    log.info("Push report");
    log.info(JSON.stringify(dataValues));
    //todo fix push, change dataelements to only add a count of errors.

    const response: UserResponse = await api
        .post<UserResponse>(
            "/tracker",
            {
                async: false,
            },
            {
                events: [
                    {
                        event: eventUid,
                        program: program.id,
                        programStage: program.programStageId,
                        orgUnit: program.orgUnitId,
                        occurredAt: new Date().toISOString(),
                        dataValues: dataValues,
                    },
                ],
            }
        )
        .getData()
        .catch(err => {
            if (err?.response?.data) {
                log.error("Push ERROR1");
                log.error(JSON.stringify(err.response.data));
                return err.response.data as UserResponse;
            } else {
                log.error("Push ERROR2");
                return { status: "ERROR", typeReports: [] };
            }
        });
    log.info("Report sent status: " + response.status);
    log.debug("Report info: " + response.typeReports);

    return response;
}
