import _ from "lodash";
import { Async } from "domain/entities/Async";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import fs from "fs";
import { UsersOptions, UsersRepository } from "domain/repositories/UsersRepository";
import {
    DataElement,
    EventDataValue,
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

//users without template group
const dataelement_invalid_users_count_code = "ADMIN_invalid_Users_1_Events";
//users with invald roles based on the upper level of the template group
const dataelement_invalid_roles_count_code = "ADMIN_invalid_Roles_Users_2_Events";
const dataelement_invalid_users_file_code = "ADMIN_invalid_Users_file_3_Events";
const dataelement_invalid_roles_file_code = "ADMIN_invalid_Roles_Users_file_4_Events";

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
            minimalRoleId: minimalRoleId,
        } = options;

        const userTemplateIds = templateGroups.map(template => {
            return template.templateId;
        });

        const allUserTemplates = await this.getUsers(userTemplateIds);

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
            debugger;
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
                    log.error(`Warning: User don't have groups ${user.id} - ${user.name}`);
                    if (user.userRoles.length == 1) {
                        if (minimalRoleId == user.userRoles[0]!.id) {
                            const userInfoRes: UserRes = {
                                user: user,
                                fixedUser: user,
                                validUserRoles: [{ id: minimalRoleId }],
                                actionRequired: false,
                                invalidUserRoles: [],
                                userNameTemplate: "User don't have groups",
                                templateIdTemplate: "User don't have groups",
                                groupIdTemplate: "User don't have groups",
                                undefinedUserGroups: true,
                            };
                            return userInfoRes;
                        }
                    }

                    const fixedUser = JSON.parse(JSON.stringify(user));
                    fixedUser.userCredentials.userRoles = [];
                    fixedUser.userRoles = [{ id: minimalRoleId }];
                    const userInfoRes: UserRes = {
                        user: user,
                        fixedUser: fixedUser,
                        validUserRoles: [],
                        actionRequired: true,
                        invalidUserRoles: user.userCredentials.userRoles,
                        userNameTemplate: "User don't have groups",
                        templateIdTemplate: "User don't have groups",
                        groupIdTemplate: "User don't have groups",
                        undefinedUserGroups: true,
                    };
                    return userInfoRes;
                } else if (user.userCredentials.userRoles === undefined) {
                    const userInfoRes: UserRes = {
                        user: user,
                        fixedUser: user,
                        validUserRoles: [{ id: minimalRoleId }],
                        actionRequired: false,
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
                    debugger;
                    //the invalid roles are the ones that are not in the valid roles
                    const allInvalidRolesSingleListFixed = allInValidRolesSingleList?.filter(item => {
                        return allValidRolesSingleList.indexOf(item) == -1;
                    });
                    //fill the valid roles in the user  against all the possible valid roles
                    const userValidRoles = user.userCredentials.userRoles.filter(userRole => {
                        return JSON.stringify(allValidRolesSingleList).indexOf(userRole.id) >= 0;
                    });
                    //fill the invalid roles in the user against all the possible invalid roles
                    const userInvalidRoles = user.userCredentials.userRoles.filter(userRole => {
                        return (
                            JSON.stringify(allValidRolesSingleList).indexOf(userRole.id) == -1 &&
                            JSON.stringify(allInvalidRolesSingleListFixed).indexOf(userRole.id) >= 0
                        );
                    });
                    if (userInvalidRoles.length > 1) {
                        if (minimalRoleId in userInvalidRoles) {
                        }
                    }
                    /* 
                    if (AllGroupMatch.length > 1) {
                        debugger;
                    } */

                    //clone user
                    const fixedUser = JSON.parse(JSON.stringify(user));
                    fixedUser.userCredentials.userRoles = userValidRoles;
                    fixedUser.userRoles = userValidRoles;

                    if (AllGroupMatch.length > 1) {
                        log.error(`Warning: User have more than 1 group ${user.id} - ${user.name}`);
                        AllGroupMatch.forEach(element => {
                            log.warn(element.groupId);
                        });
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
        debugger;
        //return userInfoRes
        const date = new Date().toLocaleString().replace(" ", "-").replace(":", "-");
        debugger;
        //users without user groups
        const usersWithErrors = userinfo.filter(item => item.undefinedUserGroups);

        //users with action required
        const usersToBeFixed = userinfo.filter(item => item.actionRequired);
        //save errors in user configs
        if (usersWithErrors.length > 0) {
            if (pushReport) {
                await pushReportToDhis(usersWithErrors, usersToBeFixed, this.api, pushProgramId);
            }
            saveInJsonFormat(JSON.stringify({ usersWithErrors }, null, 4), `${date}-users-errors`);
            saveInCsv(usersWithErrors, `${date}-users-errors`);
        }
        debugger;
        const userActionRequired = userinfo.filter(item => item.actionRequired);

        //Push users to dhis2
        if (userActionRequired.length > 0) {
            await pushUsers(userActionRequired, this.api);
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

async function pushUsers(userActionRequired: UserRes[], api: D2Api) {
    log.info("Push users to dhis2");

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
    saveResult(userActionRequired, response);
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
    debugger;
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

async function saveResult(userActionRequired: UserRes[], response: UserResponse) {
    const date = -new Date().toLocaleString();
    debugger;
    const userToPost: User[] = userActionRequired.map(item => {
        return item.fixedUser;
    });
    const userBeforePost: User[] = userActionRequired.map(item => {
        return item.user;
    });
    const csvErrorFilename = `${date}-users-push-error`;
    const jsonUserFilename = `${date}-users-push-error`;
    const csvPushedFilename = `${date}-users-pushed`;
    const jsonUserPushedFilename = `${date}-users-pushed`;
    const jsonUserPushedBackupFilename = `${date}-users-pushed-backup`;
    debugger;
    if (response.status !== "OK") {
        log.info(`Saving report (failed push)`);
        log.error(`Save errors in csv: `);
        await saveInCsv(userActionRequired, `${csvErrorFilename}`);
        log.error(`Save jsons on import error: ${jsonUserFilename}`);
        saveInJsonFormat(JSON.stringify({ response, userToPost }, null, 4), jsonUserFilename);
    } else {
        const jsonBackupUserFilename = `users-backup-error-${date}`;
        log.error(`Save pushed users details in csv: ${csvPushedFilename}`);
        await saveInCsv(userActionRequired, `${csvPushedFilename}`);
        log.error(`Save pushed users: ${jsonUserPushedFilename}`);
        saveInJsonFormat(JSON.stringify({ response, userToPost }, null, 4), jsonUserPushedFilename);
        log.error(`Save backup of users: ${jsonUserPushedFilename}`);
        saveInJsonFormat(JSON.stringify({ response, userBeforePost }, null, 4), jsonUserPushedBackupFilename);
    }
}

function saveInJsonFormat(content: string, file: string) {
    fs.writeFileSync(file + ".json", content);
    log.info(`Json saved in ${file}`);
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
    return responses.programs;
}

async function pushReportToDhis(
    usersWithErrors: UserRes[],
    usersToBeFixed: UserRes[],
    api: D2Api,
    pushProgramId: string
) {
    log.info(`Create and Pushing report to DHIS2`);
    const responseProgram = await getProgram(api, pushProgramId);
    debugger;
    const programs = responseProgram[0] ?? undefined;
    debugger;
    if (programs === undefined) {
        log.error(`Program ${pushProgramId} not found`);
        return;
    }
    const programStage: ProgramStage | undefined = programs.programStages[0];
    //todo fix orgunit.id
    const orgunitstring = JSON.stringify(programs.organisationUnits[0]);
    log.info("Orgunit1:" + orgunitstring);
    const orgUnit: { id: string } = JSON.parse(orgunitstring);
    log.info("Orgunit2:" + orgUnit.id);
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

    const dataValues: EventDataValue[] = program.dataElements.map(item => {
        switch (item.code) {
            case dataelement_invalid_users_count_code:
                return { dataElement: item.id, value: usersWithErrors.length };
            case dataelement_invalid_roles_count_code:
                return { dataElement: item.id, value: usersToBeFixed.length };
            case dataelement_invalid_users_file_code:
                return { dataElement: item.id, value: JSON.parse(JSON.stringify(usersWithErrors)) };
            case dataelement_invalid_roles_file_code:
                return { dataElement: item.id, value: JSON.parse(JSON.stringify(usersToBeFixed)) };
            default:
                return { dataElement: "", value: "" };
        }
    });
    if (dataValues.length == 0) {
        log.info(`No data elements found`);
        return;
    }
    log.info("Push report");
    log.info(JSON.stringify(program));
    //todo fix push, change dataelements to only add a count of errors.
    const response: UserResponse = await api
        .post<UserResponse>(
            "/events",
            {
                async: false,
                importStrategy: "CREATE_AND_UPDATE",
                importMode: "COMMIT",
                dataElementIdScheme: "CODE",
                preheatCache: true,
                mergeMode: "MERGE",
            },
            {
                events: [
                    {
                        program: program.id,
                        programStage: program.programStageId,
                        orgUnit: program.orgUnitId,
                        eventDate: new Date().toISOString(),
                        dataValues: dataValues,
                    },
                ],
            }
        )
        .getData()
        .catch(err => {
            if (err?.response?.data) {
                log.error(JSON.stringify(err.response.data));
                return err.response.data as UserResponse;
            } else {
                log.error("Push ERROR");
                return { status: "ERROR", typeReports: [] };
            }
        });
    log.info(JSON.stringify(dataValues));
    log.info(response.status);

    return response;
}
