import { FileUploadParameters, Files } from "@eyeseetea/d2-api/api/files";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import _ from "lodash";

import {
    PermissionFixerReport,
    PermissionFixerExtendedReport,
} from "domain/entities/user-monitoring/permission-fixer/PermissionFixerReport";
import { NamedRef } from "domain/entities/Base";
import { UserMonitoringUserResponse } from "domain/entities/user-monitoring/common/UserMonitoringUserResponse";
import { PermissionFixerReportRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerReportRepository";
import { UserMonitoringProgramMetadata } from "domain/entities/user-monitoring/common/UserMonitoringProgramMetadata";
import { UserMonitoringReportValues } from "domain/entities/user-monitoring/common/UserMonitoringReportValues";
import { PermissionFixerUser } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUser";
import { Async } from "domain/entities/Async";
import { UserMonitoringFileResourceUtils } from "../common/UserMonitoringFileResourceUtils";

const dataelement_invalid_users_groups_count_code = "ADMIN_invalid_users_groups_count_1_Events";
const dataelement_invalid_users_groups_list_code = "ADMIN_invalid_users_groups_usernames_5_Events";
const dataelement_invalid_roles_count_code = "ADMIN_invalid_users_roles_count_2_Events";
const dataelement_invalid_roles_list_code = "ADMIN_invalid_users_roles_usernames_6_Events";
const dataelement_users_pushed_code = "ADMIN_user_pushed_control_Events";
const dataelement_file_invalid_users_file_code = "ADMIN_invalid_users_backup_3_Events";
const dataelement_file_valid_users_file_code = "ADMIN_valid_users_backup_4_Events";

const csvErrorFilename = `_users_backup`;
const filenameErrorOnPush = `_users_push_error`;
const filenameUsersPushed = `_users_pushed.json`;
const filenameUserBackup = `_users_update_backup.json`;
type ServerResponse = { status: string; typeReports: object[] };

export class PermissionFixerReportD2Repository implements PermissionFixerReportRepository {
    constructor(private api: D2Api) {}

    async save(
        program: UserMonitoringProgramMetadata,
        responseGroups: PermissionFixerReport,
        responseRoles: PermissionFixerExtendedReport
    ): Async<string> {
        log.info(`Saving report `);

        log.debug(`Saving users pushed file resource`);
        const userFixedId = await UserMonitoringFileResourceUtils.saveFileResource(
            JSON.stringify(responseRoles.usersFixed),
            filenameUsersPushed,
            this.api
        );

        log.debug(`Users fixed file id: ${userFixedId}`);
        log.debug(`Saving users backup file resource`);

        const userBackupId = await UserMonitoringFileResourceUtils.saveFileResource(
            JSON.stringify(responseRoles.usersBackup),
            filenameUserBackup,
            this.api
        );

        log.debug(`Users backup file id: ${userBackupId}`);

        const response = await this.pushReportToDhis(
            responseGroups.invalidUsersCount.toString(),
            responseGroups.listOfAffectedUsers,
            responseRoles.usersFixed.length.toString(),
            responseRoles.listOfAffectedUsers,
            responseRoles.response,
            userFixedId,
            userBackupId,
            this.api,
            program,
            responseRoles.eventid
        );

        if (response?.status != "OK") {
            await this.saveUserErrorsOnLogFile(responseRoles.userProcessed, responseRoles.eventid);
            throw new Error("Error on push report: " + JSON.stringify(response));
        } else {
            return response.status;
        }
    }

    private async saveUserErrorsOnLogFile(userActionRequired: UserMonitoringUserResponse[], eventid: string) {
        const userToPost: PermissionFixerUser[] = userActionRequired.map(item => {
            return item.fixedUser;
        });
        log.error(`Save jsons on import error: ${filenameErrorOnPush}`);
        await UserMonitoringFileResourceUtils.saveInJsonFormat(
            JSON.stringify({ eventid, userToPost }, null, 4),
            filenameErrorOnPush
        );
        log.error(`Save errors in csv: `);
        await UserMonitoringFileResourceUtils.savePermissionFixerToCsv(
            userActionRequired,
            `${csvErrorFilename}`
        );
    }

    private async pushReportToDhis(
        userGroupsFixedCount: string,
        usernamesGroupModified: NamedRef[],
        usersFixedRolesCount: string,
        usernamesFixedRoles: NamedRef[],
        status: string,
        userFixedFileResourceId: string,
        userBackupFileResourceid: string,
        api: D2Api,
        program: UserMonitoringProgramMetadata,
        eventUid: string
    ) {
        log.info(`Create and Pushing report to DHIS2`);
        const dataValues: UserMonitoringReportValues[] = program.dataElements
            .map(item => {
                switch (item.code) {
                    case dataelement_invalid_users_groups_count_code:
                        return { dataElement: item.id, value: userGroupsFixedCount };
                    case dataelement_invalid_users_groups_list_code:
                        return {
                            dataElement: item.id,
                            value: usernamesGroupModified
                                .map(item => {
                                    return item.name + "(" + item.id + ")";
                                })
                                .join(","),
                        };
                    case dataelement_invalid_roles_count_code:
                        return { dataElement: item.id, value: usersFixedRolesCount };
                    case dataelement_invalid_roles_list_code:
                        return {
                            dataElement: item.id,
                            value: usernamesFixedRoles
                                .map(item => {
                                    return item.name + "(" + item.id + ")";
                                })
                                .join(","),
                        };
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
        log.info("Pushing report");

        const response: ServerResponse = await api
            .post<ServerResponse>(
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
                    return err.response.data as ServerResponse;
                } else {
                    log.error("Push ERROR without any data");
                    return { status: "ERROR", typeReports: [] };
                }
            });
        log.info("Report sent status: " + response.status);

        return response;
    }
}
