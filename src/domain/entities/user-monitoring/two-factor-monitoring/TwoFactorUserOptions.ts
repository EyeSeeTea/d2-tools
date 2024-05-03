import { NamedRef } from "domain/entities/Base";
import { UserMonitoringCountResponse } from "../common/UserMonitoring";

export interface TwoFactorUserOptions {
    userGroupsResponse?: UserMonitoringCountResponse;
    pushProgramId: NamedRef;
    twoFactorGroup: NamedRef;
}
