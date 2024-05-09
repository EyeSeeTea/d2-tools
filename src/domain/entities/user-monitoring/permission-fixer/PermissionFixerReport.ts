import { NamedRef } from "domain/entities/Base";
import { UserMonitoringUserResponse } from "../common/UserMonitoringUserResponse";
import { PermissionFixerUser } from "./PermissionFixerUser";

export interface PermissionFixerExtendedReport extends PermissionFixerReport {
    usersBackup: PermissionFixerUser[];
    usersFixed: PermissionFixerUser[];
    eventid: string;
    userProcessed: UserMonitoringUserResponse[];
}

export type PermissionFixerReport = {
    invalidUsersCount: number;
    listOfAffectedUsers: NamedRef[];
    response: string;
};
