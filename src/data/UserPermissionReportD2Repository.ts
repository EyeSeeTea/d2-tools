import fs from "fs";
import * as CsvWriter from "csv-writer";
import { FileUploadParameters, Files } from "@eyeseetea/d2-api/api/files";
import { Async } from "domain/entities/Async";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import { EventDataValue, ProgramMetadata, User, UserRes } from "./d2-users/D2Users.types";
import _ from "lodash";

import { UserPermissionsCountResponse, UserPermissionsDetails } from "domain/entities/UserPermissions";
import { getUid } from "utils/uid";
import { UserPermissionReportRepository } from "domain/repositories/UserPermissionReportRepository";

const dataelement_invalid_users_count_code = "ADMIN_invalid_users_groups_count_1_Events";
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
const csvErrorFilename = `${date}-users-backup`;
const filenameErrorOnPush = `${date}-users-push-error`;
const filenameUsersPushed = `${date}-users-pushed.json`;
const filenameUserBackup = `${date}-users-update-backup.json`;
type UserResponse = { status: string; typeReports: object[] };

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

export class UserPermissionReportD2Repository implements UserPermissionReportRepository {
    constructor(private api: D2Api) {}

    async pushReport(
        program: ProgramMetadata,
        responseGroups: UserPermissionsCountResponse,
        responseRoles: UserPermissionsDetails
    ): Promise<Async<void>> {
        const userFixedId = await this.saveFileResource(
            JSON.stringify(responseRoles.usersFixed),
            filenameUsersPushed,
            this.api
        );
        const userBackupId = await this.saveFileResource(
            JSON.stringify(responseRoles.usersBackup),
            filenameUserBackup,
            this.api
        );

        const response = await this.pushReportToDhis(
            responseGroups.invalidUsersCount.toString(),
            responseRoles.usersFixed.length.toString(),
            responseRoles.response,
            userFixedId,
            userBackupId,
            this.api,
            program,
            responseRoles.eventid
        );

        if (response?.status != "OK") {
            await this.saveUserErrorsOnLogFile(responseRoles.userProcessed, responseRoles.eventid);
        }
    }

    private async saveFileResource(jsonString: string, name: string, api: D2Api): Promise<string> {
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

    private async saveInCsv(users: UserRes[], filepath: string) {
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

    private async saveUserErrorsOnLogFile(userActionRequired: UserRes[], eventid: string) {
        const userToPost: User[] = userActionRequired.map(item => {
            return item.fixedUser;
        });
        log.error(`Save jsons on import error: ${filenameErrorOnPush}`);
        await this.saveInJsonFormat(JSON.stringify({ eventid, userToPost }, null, 4), filenameErrorOnPush);
        log.error(`Save errors in csv: `);
        await this.saveInCsv(userActionRequired, `${csvErrorFilename}`);
    }

    private saveInJsonFormat(content: string, file: string) {
        fs.writeFileSync(file + ".json", content);
        log.info(`Json saved in ${file}`);
        return file;
    }

    private async pushReportToDhis(
        usersWithErrors: string,
        usersToBeFixed: string,
        status: string,
        userFixedFileResourceId: string,
        userBackupFileResourceid: string,
        api: D2Api,
        program: ProgramMetadata,
        eventUid: string
    ) {
        log.info(`Create and Pushing report to DHIS2`);
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
                    log.error("Push ERROR ->");
                    log.error(JSON.stringify(err.response.data));
                    return err.response.data as UserResponse;
                } else {
                    log.error("Push ERROR without any data");
                    return { status: "ERROR", typeReports: [] };
                }
            });
        log.info("Report sent status: " + response.status);

        return response;
    }
}
