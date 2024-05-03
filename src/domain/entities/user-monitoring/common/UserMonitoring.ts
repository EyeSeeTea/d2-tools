import { UserRes } from "data/d2-users/D2Users.types";
import { NamedRef } from "domain/entities/Base";
import { User } from "./User";

export interface UserMonitoringDetails extends UserMonitoringCountResponse {
    usersBackup: User[];
    usersFixed: User[];
    eventid: string;
    userProcessed: UserRes[];
}

export type UserMonitoringCountResponse = {
    invalidUsersCount: number;
    listOfAffectedUsers: NamedRef[];
    response: string;
};
