import { NamedRef } from "domain/entities/Base";

export type TwoFactorUserReport = {
    invalidUsersCount: number;
    listOfAffectedUsers: NamedRef[];
};
