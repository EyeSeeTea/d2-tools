import { D2Api } from "types/d2-api";
import log from "utils/log";
import _ from "lodash";
import { getUid } from "utils/uid";
import { NamedRef } from "domain/entities/Base";
import { TwoFactorUserReport } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserReport";
import { TwoFactorReportRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorReportRepository";
import { UserMonitoringProgramMetadata } from "domain/entities/user-monitoring/common/UserMonitoringProgramMetadata";
import { UserMonitoringReportValues } from "domain/entities/user-monitoring/common/UserMonitoringReportValues";
import { Async } from "domain/entities/Async";

const dataelement_invalid_two_factor_count_code = "ADMIN_users_without_two_factor_count_7_Events";
const dataelement_invalid_two_factor_usernames_list_code = "ADMIN_users_without_two_factor_8_Events";

const date = new Date()
    .toLocaleString()
    .replace(/ /g, "_")
    .replace(/:/g, "_")
    .replace(/\//g, "_")
    .replace(/\\/, "_")
    .replace("\\", "_")
    .replace(/,/g, "")
    .replace(/-/g, "_");
type ServerResponse = { status: string; typeReports: object[] };

export class TwoFactorReportD2Repository implements TwoFactorReportRepository {
    constructor(private api: D2Api) {}
    async save(program: UserMonitoringProgramMetadata, report: TwoFactorUserReport): Async<string> {
        const response = await this.push(
            report.invalidUsersCount.toString(),
            report.listOfAffectedUsers,
            this.api,
            program,
            getUid(date)
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
        invalidConfigUsers: NamedRef[],
        api: D2Api,
        program: UserMonitoringProgramMetadata,
        eventUid: string
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
                            value: invalidConfigUsers
                                .map(item => {
                                    return item.name + "(" + item.id + ")";
                                })
                                .join(","),
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

        return response;
    }
}
