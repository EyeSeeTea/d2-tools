import { UserMonitoringProgramMetadata } from "domain/entities/user-monitoring/common/UserMonitoringProgramMetadata";
import { PermissionFixerUser } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUser";
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
        {
            id: "PDAPJ38H7Pl",
            code: "ADMIN_users_without_two_factor_count_7_Events",
            name: "ADMIN_users_without_two_factor_count_7_Events",
        },
        {
            id: "Ss4ZVwDJKDe",
            code: "ADMIN_users_without_two_factor_8_Events",
            name: "ADMIN_users_without_two_factor_8_Events",
        },
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
