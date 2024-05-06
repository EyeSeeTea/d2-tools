import { NamedRef } from "domain/entities/Base";
import { UserMonitoringUser } from "domain/entities/user-monitoring/common/UserMonitoringUser";
import { UserMonitoringUserResponse } from "../common/UserMonitoringUserResponse";

export interface PermissionFixerExtendedReport extends PermissionFixerReport {
    usersBackup: UserMonitoringUser[];
    usersFixed: UserMonitoringUser[];
    eventid: string;
    userProcessed: UserMonitoringUserResponse[];
}

export type PermissionFixerReport = {
    invalidUsersCount: number;
    listOfAffectedUsers: NamedRef[];
    response: string;
};
