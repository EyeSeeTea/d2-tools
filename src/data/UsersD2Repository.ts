import _, { get } from "lodash";
import { Async } from "domain/entities/Async";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import fs from "fs";
import { UsersOptions, UsersRepository } from "domain/repositories/UsersRepository";
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
    UserRoleAuthority,
} from "./d2-users/D2Users.types";
import * as CsvWriter from "csv-writer";
import { getUid } from "utils/uid";
import { FileUploadParameters, Files } from "@eyeseetea/d2-api/api/files";
import logger from "utils/log";

//users without template group
const dataelement_invalid_users_count_code = "ADMIN_invalid_Groups_1_Events";
//users with invald roles based on the upper level of the template group
const dataelement_invalid_roles_count_code = "ADMIN_invalid_Roles_Users_2_Events";
const dataelement_users_pushed_code = "ADMIN_user_pushed_control_Events";
const dataelement_file_invalid_users_file_code = "ADMIN_invalid_Users_file_resource_backup_3_Events";
const dataelement_file_valid_users_file_code = "ADMIN_valid_Users_file_resource_backup_4_Events";

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
const filenameUsersPushed = `${date}-users-pushed`;
const filenameUserBackup = `${date}-users-update-backup`;

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

        const userTemplateIds = templateGroups.map(template => {
            return template.templateId;
        });

        const allUserTemplates = await this.getUsers(userTemplateIds);

        const userRoles: UserRoleAuthority[] = await this.getAllUserRoles(options);
        const validateAuthInRoles = userRoles.filter(role => {
            return role.authorities.length == 0;
        });

        if (validateAuthInRoles.length > 0) {
            validateAuthInRoles.forEach(role => {
                log.error(`Role ${role.id} - ${role.name} has no authorities`);
            });

            validateAuthInRoles.forEach(role => {
                if (role.id in excludedRoles) {
                    throw new Error(
                        "Roles with no authorities are not allowed. Fix them in the server or add in the ignore list"
                    );
                }
            });
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

            item.validRolesByAuthority = validRolesByAuthority ?? [];
            item.invalidRolesByAuthority = invalidRolesByAuthority ?? [];
            item.validRolesById = validRoles ?? [];
            item.invalidRolesById = invalidRoles ?? [];
            item.name = allUserTemplates.find(template => {
                return template.id == item.templateId;
            })?.name;
        });

        //fix users without any group

        const allUsersGroupCheck = await this.getAllUsers(excludedUsersIds);
        const userIdWithoutGroups: IdItem[] = _.compact(
            allUsersGroupCheck.map(user => {
                const templateGroupMatch = templateGroups.find(template => {
                    return user.userGroups.some(
                        userGroup => userGroup != undefined && template.groupId == userGroup.id
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

        //Push users without group fix
        if (userIdWithoutGroups.length > 0) {
            const minimalUserGroup = await this.getGroups([minimalGroupId.id]);
            await this.pushUsersToGroup(minimalUserGroup, userIdWithoutGroups);
        }

        //fix user roles based on its groups
        debugger;
        const allUsers = await this.getAllUsers(excludedUsersIds);

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
                    //template not found -> all roles are invalid except the minimal role
                    log.error(
                        `Warning: User don't have groups ${user.id} - ${user.name} error adding to minimal group  ${minimalGroupId}`
                    );
                    throw new Error("User: " + user.username + " don't have valid groups");
                } else if (user.userCredentials.userRoles === undefined) {
                    const fixedUser = JSON.parse(JSON.stringify(user));
                    fixedUser.userCredentials.userRoles = [{ id: minimalRoleId.id }];
                    fixedUser.userRoles = [{ id: minimalRoleId }];
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
                            if (item.userid == user.id) return item.roleid;
                        })
                    );

                    const allExceptionsToBeIgnoredByGroup: string[] = _.compact(
                        excludedRolesByGroup.flatMap(itemexception => {
                            const exist = user.userGroups.some(item => {
                                return item.id === itemexception.groupid;
                            });
                            if (exist) {
                                return itemexception.roleid;
                            } else {
                                return [];
                            }
                        })
                    );

                    const allExceptionsToBeIgnoredByRole: string[] = _.compact(
                        excludedRolesByRole.flatMap(item => {
                            if (item.activeroleid in user.userRoles) return item.ignoreroleid;
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
                    /* 
                    if (AllGroupMatch.length > 1) {
                        debugger;
                    } */

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
                            userNameTemplate: templateGroupMatch.name,
                            templateIdTemplate: templateGroupMatch.templateId,
                            groupIdTemplate: templateGroupMatch.groupId,
                            multipleUserGroups: AllGroupMatch.map(item => item.groupId),
                        };
                        return userInfoRes;
                    } else {
                        const userInfoRes: UserRes = {
                            user: user,
                            fixedUser: fixedUser,
                            validUserRoles: userValidRoles,
                            actionRequired: userInvalidRoles.length > 0,
                            invalidUserRoles: userInvalidRoles,
                            userNameTemplate: templateGroupMatch.name,
                            templateIdTemplate: templateGroupMatch.templateId,
                            groupIdTemplate: templateGroupMatch.groupId,
                        };

                        return userInfoRes;
                    }
                }
            })
        );

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
        debugger;
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
                    //recovery from response
                    const eventid = getUid(date);
                    log.debug(eventid);

                    const userFixed: User[] = userActionRequired.map(item => {
                        return item.fixedUser;
                    });
                    const userBackup: User[] = userActionRequired.map(item => {
                        return item.user;
                    });
                    const userFixedId = await trysave(
                        JSON.stringify(userFixed),
                        filenameUsersPushed,
                        this.api
                    );
                    const userBackupId = await trysave(
                        JSON.stringify(userBackup),
                        filenameUserBackup,
                        this.api
                    );
                    debugger;
                    saveUserChangesBakup(usersToBeFixed, eventid);
                    saveInJsonFormat(
                        JSON.stringify({ usersWithErrors: usersWithErrorsInGroups }, null, 4),
                        `${date}-groups-pushed`
                    );
                    saveInCsv(usersWithErrorsInGroups, `${date}-groups-pushed`);

                    const response = await pushReportToDhis(
                        usersWithErrorsInGroups.length.toString(),
                        usersToBeFixed.length.toString(),
                        status,
                        userFixedId,
                        userBackupId,
                        this.api,
                        pushProgramId.id,
                        eventUid
                    );
                    debugger;
                    //recovery eventid
                    //Push users to dhis2

                    if (response) {
                        await saveUserErrors(userActionRequired, response, eventUid);
                    }
                }
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

    /*     public async save(file: File): Promise<FileId> {
        const auth = this.api;
        const t : FileUploadParameters;
        this.api.files.saveFileResource(,"d");
        const authHeaders: Record<string, string> = this.getAuthHeaders(auth);

        const formdata = new FormData();
        formdata.append("file", file);
        formdata.append("filename", file.name);

        const fetchOptions: RequestInit = {
            method: "POST",
            headers: { ...authHeaders },
            body: formdata,
            credentials: auth ? "omit" : ("include" as const),
        };

        const response = await fetch(new URL(`/api/fileResources`, this.instance.url).href, fetchOptions);
        if (!response.ok) {
            throw Error(
                `An error has ocurred saving the resource file of the document '${file.name}' in ${this.instance.name}`
            );
        } else {
            const apiResponse: SaveApiResponse = JSON.parse(await response.text());

            return apiResponse.response.fileResource.id;
        }
    } */

    async getAllUserRoles(options: UsersOptions): Promise<UserRoleAuthority[]> {
        log.info(`Get metadata: All roles excluding ids: ${options.excludedRoles.join(", ")}`);
        const excludeRoles = options.excludedRoles;
        if (excludeRoles.length == 0) {
            const responses = await this.api
                .get<UserRoleAuthorities>(`/userRoles.json?paging=false&fields=id,name,authorities`)
                .getData();
            log.info("ok");
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
        debugger;
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
}

async function pushUsers(userToPost: User[], api: D2Api) {
    log.info("Push users to dhis2");

    const usersReadyToPost: Users = { users: userToPost };
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
    debugger;
    log.error(`Save pushed users details in csv: ${csvPushedFilename}`);
    await saveInCsv(userActionRequired, `${csvPushedFilename}`);
    log.error(`Save pushed users: ${filenameUsersPushed}`);
    await saveInJsonFormat(JSON.stringify({ userToPost }, null, 4), filenameUsersPushed);
    log.error(`Save backup of users: ${filenameUserBackup}`);
    await saveInJsonFormat(JSON.stringify({ userBeforePost }, null, 4), filenameUserBackup);
}

async function saveUserErrors(userActionRequired: UserRes[], response: UserResponse, eventid: string) {
    const userToPost: User[] = userActionRequired.map(item => {
        return item.fixedUser;
    });
    log.error(`Save jsons on import error: ${filenameErrorOnPush}`);
    await saveInJsonFormat(JSON.stringify({ response, userToPost }, null, 4), filenameErrorOnPush);
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
    /* 
    const programs = await api.models.programs
    .get({
        fields: { id: true, organisationUnits: {id :true }, programStages: { id: true, programStageDataElements: { id:true, dataElement: { id:true, name:true, code:true } } }},
        filter: { id: { eq: programUid } },
        paging: false,
    }
    )
    .getData();  */
    debugger;
    return responses.programs;
}

export async function trysave(jsonString: string, name: string, api: D2Api): Promise<string> {
    debugger;
    //const jsonBlob: Blob = new Blob([jsonString], { type: "application/json" });
    const jsonBlob = Buffer.from(jsonString, "utf-8");

    debugger;
    const uploadParams = {
        name: name,
        data: jsonBlob,
    };

    const files = new Files(api);
    //try
    //const response = files.upload(uploadParams).getData();
    const form: FileUploadParameters = {
        id: getUid(name),
        name: "name",
        data: jsonBlob,
        ignoreDocument: true,
    };
    const response = await files.upload(form).getData();
    const fileresourceId = response.fileResourceId;
    const documentId = response.fileResourceId;
    logger.info("file resource" + fileresourceId);
    logger.info("document" + documentId);
    return documentId;
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
    debugger;
    const responseProgram = await getProgram(api, pushProgramId);

    const programs = responseProgram[0] ?? undefined;

    if (programs === undefined) {
        debugger;
        log.error(`Program ${pushProgramId} not found`);
        return;
    }
    const programStage: ProgramStage | undefined = programs.programStages[0];
    //todo fix orgunit.id
    const orgunitstring = JSON.stringify(programs.organisationUnits[0]);
    const orgUnit: { id: string } = JSON.parse(orgunitstring);
    const orgUnitId: string = orgUnit.id;
    debugger;
    if (programStage === undefined) {
        debugger;
        log.error(`Programstage ${pushProgramId} not found`);
        return;
    }
    if (orgUnitId === undefined) {
        debugger;
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
    debugger;
    if (dataValues.length == 0) {
        log.info(`No data elements found`);
        return;
    }
    log.info("Push report");
    log.info(JSON.stringify(dataValues));
    //todo fix push, change dataelements to only add a count of errors.
    debugger;
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
    log.info(response.status);
    debugger;
    return response;
}
