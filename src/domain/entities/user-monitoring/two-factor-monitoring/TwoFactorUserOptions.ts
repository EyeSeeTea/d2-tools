import { NamedRef } from "domain/entities/Base";
import { TwoFactorUserReport } from "./TwoFactorUserReport";

export interface TwoFactorUserOptions {
    userGroupsResponse?: TwoFactorUserReport;
    pushProgramId: NamedRef;
    twoFactorGroup: NamedRef;
}
