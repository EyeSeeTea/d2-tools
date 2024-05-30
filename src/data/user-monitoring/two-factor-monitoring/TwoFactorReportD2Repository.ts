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

const filenameUserReported = `_users_reported.csv`;
type ServerResponse = { status: string; typeReports: object[] };

export class TwoFactorReportD2Repository implements TwoFactorReportRepository {
    constructor(private api: D2Api) {}
    async save(program: UserMonitoringProgramMetadata, report: TwoFactorUserReport): Async<string> {
        const twoFactorUsersFileResourceId = await UserMonitoringFileResourceUtils.saveFileResource(
            report.listOfAffectedUsers
                .map(user => {
                    return user.name + "," + user.id;
                })
                .join("\n"),
            filenameUserReported,
            this.api
        );
        const response = await this.push(
            report.invalidUsersCount.toString(),
            twoFactorUsersFileResourceId,
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
        invalidConfigUsers: string,
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
                        return {
                            dataElement: item.id,
                            value: invalidConfigUsers,
                        };
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
