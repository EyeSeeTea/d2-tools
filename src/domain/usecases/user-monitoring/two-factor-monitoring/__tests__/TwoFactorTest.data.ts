import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";
import { TwoFactorUserOptions } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserOptions";

export const config: TwoFactorUserOptions = {
    pushProgram: {
        id: "IKpEgoQ4S0r",
        name: "Event program uid",
    },
    twoFactorGroup: {
        id: "MkELexlZOj9",
        name: "TwoFactor usergroup",
    },
};

export const NoUsersReport = {
    invalidUsersCount: 0,
    listOfAffectedUsers: [],
};

export const userWithTwoFA: TwoFactorUser = {
    id: "userUid",
    twoFA: true,
    username: "username",
};

export const userWithoutTwoFA: TwoFactorUser = {
    id: "userUid2",
    twoFA: false,
    username: "username2",
};

export const listOfUsers: TwoFactorUser[] = [userWithTwoFA, userWithoutTwoFA];
export const listOfUsersWithTwoInvalid: TwoFactorUser[] = [userWithTwoFA, userWithoutTwoFA, userWithoutTwoFA];
export const listOfUsersWithTwoValid: TwoFactorUser[] = [userWithTwoFA, userWithTwoFA, userWithoutTwoFA];
