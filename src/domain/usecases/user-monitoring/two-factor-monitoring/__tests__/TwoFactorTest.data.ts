import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";
import { TwoFactorUserOptions } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserOptions";

const common_config = {
    pushProgram: {
        id: "IKpEgoQ4S0r",
        name: "Event program uid",
    },
    twoFactorGroup: {
        id: "MkELexlZOj9",
        name: "TwoFactor usergroup",
    },
    whoAccountGroup: {
        id: "MkELexlZOj8",
        name: "Who account usergroup",
    }
};

export const default_config: TwoFactorUserOptions = {
    ...common_config,
    exceptionGroup: [
    ]
};

export const config_exception_and_disabled: TwoFactorUserOptions = {
    ...common_config,
    exceptionGroup: [
      {
        id: "dummy_uid",
        name: "dummy_group_name"
      }
    ]
};

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
    userGroups: [ {
        id: "MkELexlZOj9",
        name: "dummy_group_name"
      }],
};

export const userWithoutTwoFA: TwoFactorUser = {
    id: "userUid2",
    twoFA: false,
    disabled: false,
    username: "username2",
    externalAuth: false,
    userGroups: [ {
        id: "MkELexlZOj9",
        name: "dummy_group_name"
      }],
};

export const userWithTwoFAdisabled: TwoFactorUser = {
    id: "userUid",
    twoFA: true,
    disabled: true,
    username: "username",
    externalAuth: false,
    userGroups: [ {
        id: "MkELexlZOj9",
        name: "dummy_group_name"
      }],
};
export const userWithoutTwoFAdisabled: TwoFactorUser = {
    id: "userUid2",
    twoFA: false,
    disabled: true,
    username: "username2",
    externalAuth: false,
    userGroups: [ {
        id: "MkELexlZOj9",
        name: "dummy_group_name"
      }],
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
            name: "Who account usergroup"
        }
    ],
};

export const userInvalidAuth: TwoFactorUser = {
    id: "userUid4",
    twoFA: false,
    disabled: false,
    username: "username4",
    externalAuth: false,
    userGroups: []
};

export const mixedInvalidUsers: TwoFactorUser[] = [
    userWithoutTwoFA,        // 2FA invalid
    userWithoutExternalAuth, // WHO invalid
    userInvalidAuth          // Auth invalid
];


export const listOfUsers: TwoFactorUser[] = [userWithTwoFA, userWithoutTwoFA];
export const listOfUsersWithTwoInvalid: TwoFactorUser[] = [userWithTwoFA, userWithoutTwoFA, userWithoutTwoFA];
export const listOfUsersWithTwoValid: TwoFactorUser[] = [userWithTwoFA, userWithTwoFA, userWithoutTwoFA];
