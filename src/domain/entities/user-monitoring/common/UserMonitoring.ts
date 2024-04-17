import { UserRes } from "data/d2-users/D2Users.types";
import { Item } from "./Identifier";
import { User } from "./User";

export interface UserMonitoringDetails extends UserMonitoringCountResponse {
    usersBackup: User[];
    usersFixed: User[];
    eventid: string;
    userProcessed: UserRes[];
}

export type UserMonitoringCountResponse = {
    invalidUsersCount: number;
    listOfAffectedUsers: Item[];
    response: string;
};
