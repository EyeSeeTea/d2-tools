import { NamedRef } from "domain/entities/Base";
import { User } from "./User";
import { UserResponse } from "./UserResponse";

export interface UserMonitoringExtendedResult extends UserMonitoringBasicResult {
    usersBackup: User[];
    usersFixed: User[];
    eventid: string;
    userProcessed: UserResponse[];
}

export type UserMonitoringBasicResult = {
    invalidUsersCount: number;
    listOfAffectedUsers: NamedRef[];
    response: string;
};
