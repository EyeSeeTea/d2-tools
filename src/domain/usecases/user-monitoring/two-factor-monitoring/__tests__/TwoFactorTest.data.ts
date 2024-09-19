import { UserMonitoringProgramMetadata } from "domain/entities/user-monitoring/common/UserMonitoringProgramMetadata";
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

export const oneInvalidUserTwoFactorReport = {
    invalidUsersCount: 1,
    listOfAffectedUsers: [
        {
            id: "userUid",
            name: "username",
        },
    ],
};

export const programMetadata: UserMonitoringProgramMetadata = {
    id: "IKpEgoQ4S0r",
    programStageId: "aHbPlvAb2bu",
    dataElements: [
        { id: "PDAPJ38H7Pl", code: "code", name: "name" },
        { id: "Ss4ZVwDJKDe", code: "code", name: "name" },
        { id: "tBueu6LT6Ge", code: "code", name: "name" },
        { id: "TCMlJbsuNeV", code: "code", name: "name" },
        { id: "jsYv1rl8o1H", code: "code", name: "name" },
        { id: "tKOx5UteL5t", code: "code", name: "name" },
        { id: "R6NVJyr7upX", code: "code", name: "name" },
    ],
    orgUnitId: "wLoK6XpZq8I",
};
export interface UserMonitoringDataElement {
    id: string;
    code: string;
    name: string;
}

export const zeroInvalidUserTwoFactorReport = {
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
