import { NamedRef } from "domain/entities/Base";
import { UserMonitoringBasicResult } from "../common/UserMonitoring";

export interface TwoFactorUserOptions {
    userGroupsResponse?: UserMonitoringBasicResult;
    pushProgramId: NamedRef;
    twoFactorGroup: NamedRef;
}
