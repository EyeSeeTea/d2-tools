import { NamedRef } from "domain/entities/Base";

export type UserWithoutTwoFactor = {
    invalidUsersCount: number;
    listOfAffectedUsers: NamedRef[];
    response: string;
};
