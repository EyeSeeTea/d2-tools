import { NamedRef } from "domain/entities/Base";
import { User } from "./User";
import { UserResponse } from "./UserResponse";

export interface UserMonitoringDetails extends UserMonitoringCountResponse {
    usersBackup: User[];
    usersFixed: User[];
    eventid: string;
    userProcessed: UserResponse[];
}

export type UserMonitoringCountResponse = {
    invalidUsersCount: number;
    listOfAffectedUsers: NamedRef[];
    response: string;
};
