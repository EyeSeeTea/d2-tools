import { Item } from "../common/Identifier";
import { UserMonitoringCountResponse } from "../common/UserMonitoring";

export interface TwoFactorUserOptions {
    userGroupsResponse?: UserMonitoringCountResponse;
    pushProgramId: Item;
    twoFactorGroup: Item;
}
