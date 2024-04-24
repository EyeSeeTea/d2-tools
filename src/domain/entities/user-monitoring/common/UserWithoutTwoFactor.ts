import { Item } from "./Identifier";

export type UserWithoutTwoFactor = {
    invalidUsersCount: number;
    listOfAffectedUsers: Item[];
    response: string;
};
