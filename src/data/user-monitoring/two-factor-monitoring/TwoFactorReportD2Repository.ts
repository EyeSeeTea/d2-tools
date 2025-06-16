import { D2Api } from "types/d2-api";
import log from "utils/log";
import _ from "lodash";
import { TwoFactorUserReport } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserReport";
import { TwoFactorReportRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorReportRepository";
import { UserMonitoringProgramMetadata } from "domain/entities/user-monitoring/common/UserMonitoringProgramMetadata";
import { UserMonitoringReportValues } from "domain/entities/user-monitoring/common/UserMonitoringReportValues";
import { Async } from "domain/entities/Async";
import { UserMonitoringFileResourceUtils } from "../common/UserMonitoringFileResourceUtils";

const dataelement_invalid_two_factor_count_code = "ADMIN_users_without_two_factor_count_7_Events";
const dataelement_invalid_two_factor_usernames_list_code = "ADMIN_users_without_two_factor_8_Events";
const dataelement_invalid_who_accounts_list = "ADMIN_users_with_invalid_who_account_9_Events";
const dataelement_invalid_who_accounts = "ADMIN_users_with_invalid_who_account_count_10";
const dataelement_invalid_auth_list = "ADMIN_users_without_auth_groups_11_Events";
const dataelement_invalid_auth = "ADMIN_users_without_auth_groups_count_12_Events";

const filenameUserReported = `_users_reported.csv`;
type ServerResponse = { status: string; typeReports: object[] };

export class TwoFactorReportD2Repository implements TwoFactorReportRepository {
    constructor(private api: D2Api) {}
    async save(program: UserMonitoringProgramMetadata, report: TwoFactorUserReport): Async<string> {
        const twoFactorUsersFileResourceId = await UserMonitoringFileResourceUtils.saveFileResource(
            report.invalidTwoFAList
                .map(user => {
                    return user.name + "," + user.id;
                })
                .join("\n"),
            "_twoFa"+filenameUserReported,
            this.api
        );

        const whoAccountUsersFileResourceId = await UserMonitoringFileResourceUtils.saveFileResource(
            report.invalidWhoList
                .map(user => {
                    return user.name + "," + user.id;
                })
                .join("\n"),
            "_who"+filenameUserReported,
            this.api
        );
        const invalidUsersFileResourceId = await UserMonitoringFileResourceUtils.saveFileResource(
            report.invalidAuthList
                .map(user => {
                    return user.name + "," + user.id;
                })
                .join("\n"),
            "_invalid"+filenameUserReported,
            this.api
        );
        const response = await this.push(
            report.invalidTwoFACount.toString(),
            twoFactorUsersFileResourceId,
            report.invalidWhoCount.toString(),
            whoAccountUsersFileResourceId,
            report.invalidAuthCount.toString(),
            invalidUsersFileResourceId,
            this.api,
            program
        );
        if (response?.status != "OK") {
            throw new Error("Error on push report: " + JSON.stringify(response));
        } else {
            log.info("Report sent status: " + response.status);
            return response.status;
        }
    }

    private async push(
        invalidConfigNumber: string,
        invalidFileReferenceListUsers: string,
        invalidWhoAccounts: string,
        invalidFileReferenceWhoAccounts: string,
        invalidAuth: string,
        invalidFileReferenceAuth: string,
        api: D2Api,
        program: UserMonitoringProgramMetadata
    ) {
        log.info(`Create and Pushing users without two factor report to DHIS2`);

        const dataValues: UserMonitoringReportValues[] = program.dataElements
            .map(item => {
                switch (item.code) {
                    case dataelement_invalid_two_factor_count_code:
                        return { dataElement: item.id, value: invalidConfigNumber };
                    case dataelement_invalid_two_factor_usernames_list_code:
                        if (invalidConfigNumber == "0") return { dataElement: "", value: "" };
                        return { dataElement: item.id, value: invalidFileReferenceListUsers };
                    case dataelement_invalid_who_accounts:
                        if (invalidWhoAccounts == "0") return { dataElement: "", value: "" };
                        return { dataElement: item.id, value: invalidWhoAccounts };
                    case dataelement_invalid_who_accounts_list:
                        if (invalidFileReferenceWhoAccounts == "0") return { dataElement: "", value: "" };
                        return { dataElement: item.id, value: invalidFileReferenceWhoAccounts };
                    case dataelement_invalid_auth:
                        if (invalidAuth == "0") return { dataElement: "", value: "" };
                        return { dataElement: item.id, value: invalidAuth };
                    case dataelement_invalid_auth_list:
                        if (invalidFileReferenceAuth == "0") return { dataElement: "", value: "" };
                        return { dataElement: item.id, value: invalidFileReferenceAuth };
                    default:
                        return { dataElement: "", value: "" };
                }
            })
            .filter(dataValue => dataValue.dataElement !== "")
            .filter(dataValue => dataValue.value !== "");

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

        return response;
    }
}
