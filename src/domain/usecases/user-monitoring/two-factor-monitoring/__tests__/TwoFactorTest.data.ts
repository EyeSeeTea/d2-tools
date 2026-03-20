import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";

export const NoUsersReport = {
    invalidUsersCount: 0,
    listOfAffectedUsers: [],
};

export const userWithTwoFA: TwoFactorUser = {
    id: "userUid",
    twoFA: true,
    disabled: false,
    username: "username",
    externalAuth: false,
    userGroups: [
        {
            id: "MkELexlZOj9",
            name: "dummy_group_name",
        },
    ],
    created: "2020-01-01T00:00:00.000",
};

export const userInTwoFAGroupButWithExternalAuth: TwoFactorUser = {
    id: "userUid",
    twoFA: false,
    disabled: false,
    username: "username",
    externalAuth: true,
    userGroups: [
        {
            id: "MkELexlZOj9",
            name: "dummy_group_name",
        },
    ],
    created: "2020-01-01T00:00:00.000",
};

export const userWithoutTwoFA: TwoFactorUser = {
    id: "userUid2",
    twoFA: false,
    disabled: false,
    username: "username2",
    externalAuth: false,
    userGroups: [
        {
            id: "MkELexlZOj9",
            name: "dummy_group_name",
        },
    ],
    created: "2020-01-01T00:00:00.000",
};

export const userWithTwoFAdisabled: TwoFactorUser = {
    id: "userUid",
    twoFA: true,
    disabled: true,
    username: "username",
    externalAuth: false,
    userGroups: [
        {
            id: "MkELexlZOj9",
            name: "dummy_group_name",
        },
    ],
    created: "2020-01-01T00:00:00.000",
};
export const userWithoutTwoFAdisabled: TwoFactorUser = {
    id: "userUid2",
    twoFA: false,
    disabled: true,
    username: "username2",
    externalAuth: false,
    userGroups: [
        {
            id: "MkELexlZOj9",
            name: "dummy_group_name",
        },
    ],
    created: "2020-01-01T00:00:00.000",
};

export const userWithoutExternalAuth: TwoFactorUser = {
    id: "userUid3",
    twoFA: true,
    disabled: false,
    username: "username3",
    externalAuth: false,
    userGroups: [
        {
            id: "MkELexlZOj8",
            name: "Who account usergroup",
        },
    ],
    created: "2020-01-01T00:00:00.000",
};

export const userInvalidAuth: TwoFactorUser = {
    id: "userUid4",
    twoFA: false,
    disabled: false,
    username: "username4",
    externalAuth: false,
    userGroups: [],
    created: "2020-01-01T00:00:00.000",
};

export const mixedInvalidUsers: TwoFactorUser[] = [
    userWithoutTwoFA, // 2FA invalid
    userWithoutExternalAuth, // WHO invalid
    userInvalidAuth, // Auth invalid
];

export const listOfUsersOneValidOneInvalid: TwoFactorUser[] = [userWithTwoFA, userWithoutTwoFA];
export const listOfUsersWithTwoInvalid: TwoFactorUser[] = [userWithTwoFA, userWithoutTwoFA, userWithoutTwoFA];
export const listOfUsersWithTwoValid: TwoFactorUser[] = [userWithTwoFA, userWithTwoFA, userWithoutTwoFA];
