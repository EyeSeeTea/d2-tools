import { NamedRef } from "domain/entities/Base";
import { UserMonitoringProgramMetadata } from "domain/entities/user-monitoring/common/UserMonitoringProgramMetadata";
import {
    PermissionFixerConfig,
    PermissionFixerMetadataConfig,
} from "domain/entities/user-monitoring/permission-fixer/PermissionFixerConfigOptions";
import {
    PermissionFixerTemplateGroup,
    PermissionFixerTemplateGroupExtended,
} from "domain/entities/user-monitoring/permission-fixer/PermissionFixerTemplates";
import { PermissionFixerUser } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUser";


export const templateGroup: PermissionFixerTemplateGroup = {
    group: {
        id: "template_group_uid",
        name: "template_group_name",
    },
    template: {
        id: "user_template_uid",
        name: "user_template_name",
    },
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

export const fakeTemplateUser: PermissionFixerUser = {
    //lastUpdated: "2024-09-16T14:51:06.958",
    id: "CHbcHcmgoZ7",
    //href: "https://server/api/users/CHbcHcmgoZ5",
    //created: "2018-05-02T11:33:24.434",
    //lastLogin: "2024-09-16T14:51:06.955",
    twoFA: false,
    invitation: false,
    //selfRegistered: false,
    firstName: "Fake",
    name: "Fake Dummy TEMPLATE",
    favorite: false,
    //openId: "dummy@email.com",
    displayName: "Fake Dummy TEMPLATE",
    externalAuth: false,
    externalAccess: false,
    surname: "TEMPLATE",
    disabled: false,
    email: "TEMPLATE@email.com",
    username: "TEMPLATE",
    lastUpdatedBy: {
        displayName: "fake complete name",
        name: "fake complete name",
        id: "TuqkLj1igOH",
        username: "fakeusername",
    },
    userCredentials: {
        //openId: "dummy@email.com",
        lastLogin: "2024-09-16T14:51:06.955",
        invitation: false,
        disabled: false,
        twoFA: false,
        username: "TEMPLATE",
        userRoles: [
            {
                id: "IKpEgoQ4S03",
                name: "Minimal role uid",
            },
        ],
        //this is a bit different in 2.38.7
        lastUpdated: "",
        passwordLastUpdated: "",
        selfRegisterd: false,
        uid: "",
        twoFactorEnabled: false,
    },
    createdBy: {
        displayName: "fake complete name",
        name: "fake complete name",
        id: "TuqkLj1igOH",
        username: "fakeusername",
    },
    userGroups: [
        {
            id: "dhWMtH5yC2h",
            name: "userGroup name",
        },
    ],
    userRoles: [
        {
            id: "IKpEgoQ4S03",
            name: "Minimal role uid",
        },
    ],
    selftRefistered: false,
    phoneNumber: "",
    passwordLastUpdated: "",
};

export const fakeValidUser: PermissionFixerUser = {
    //lastUpdated: "2024-09-16T14:51:06.958",
    id: "CHbcHcmgoZ5",
    //href: "https://server/api/users/CHbcHcmgoZ5",
    //created: "2018-05-02T11:33:24.434",
    //lastLogin: "2024-09-16T14:51:06.955",
    twoFA: false,
    invitation: false,
    //selfRegistered: false,
    firstName: "Fake",
    name: "Fake Dummy",
    favorite: false,
    //openId: "dummy@email.com",
    displayName: "Fake Dummy",
    externalAuth: false,
    externalAccess: false,
    surname: "Dummy",
    disabled: false,
    email: "dummy@email.com",
    username: "userusername",
    lastUpdatedBy: {
        displayName: "fake complete name",
        name: "fake complete name",
        id: "TuqkLj1igOH",
        username: "fakeusername",
    },
    userCredentials: {
        //openId: "dummy@email.com",
        lastLogin: "2024-09-16T14:51:06.955",
        invitation: false,
        disabled: false,
        twoFA: false,
        username: "userusername",
        userRoles: [
            {
                id: "tocVqzvmpI0",
                name: "userRole name",
            },
        ],
        //this is a bit different in 2.38.7
        lastUpdated: "",
        passwordLastUpdated: "",
        selfRegisterd: false,
        uid: "",
        twoFactorEnabled: false,
    },
    createdBy: {
        displayName: "fake complete name",
        name: "fake complete name",
        id: "TuqkLj1igOH",
        username: "fakeusername",
    },
    userGroups: [
        {
            id: "dhWMtH5yC2h",
            name: "userGroup name",
        },
    ],
    userRoles: [
        {
            id: "tocVqzvmpI0",
            name: "userRole name",
        },
    ],
    selftRefistered: false,
    phoneNumber: "",
    passwordLastUpdated: "",
};

export const fakeInvalidUser: PermissionFixerUser = {
    //lastUpdated: "2024-09-16T14:51:06.958",
    id: "CHbcHcmgoZ5",
    //href: "https://server/api/users/CHbcHcmgoZ5",
    //created: "2018-05-02T11:33:24.434",
    //lastLogin: "2024-09-16T14:51:06.955",
    twoFA: false,
    invitation: false,
    //selfRegistered: false,
    firstName: "Fake",
    name: "Fake Dummy",
    favorite: false,
    //openId: "dummy@email.com",
    displayName: "Fake Dummy",
    externalAuth: false,
    externalAccess: false,
    surname: "Dummy",
    disabled: false,
    email: "dummy@email.com",
    username: "userusername",
    lastUpdatedBy: {
        displayName: "fake complete name",
        name: "fake complete name",
        id: "TuqkLj1igOH",
        username: "fakeusername",
    },
    userCredentials: {
        //openId: "dummy@email.com",
        lastLogin: "2024-09-16T14:51:06.955",
        invitation: false,
        disabled: false,
        twoFA: false,
        username: "userusername",
        userRoles: [
            {
                id: "invalidRoleId",
                name: "invalid userRole name",
            },
            {
                id: "tocVqzvmpI0",
                name: "userRole name",
            },
        ],
        //this is a bit different in 2.38.7
        lastUpdated: "",
        passwordLastUpdated: "",
        selfRegisterd: false,
        uid: "",
        twoFactorEnabled: false,
    },
    createdBy: {
        displayName: "fake complete name",
        name: "fake complete name",
        id: "TuqkLj1igOH",
        username: "fakeusername",
    },
    userGroups: [
        {
            id: "dhWMtH5yC2h",
            name: "userGroup name",
        },
    ],
    userRoles: [
        {
            id: "invalidRoleId",
            name: "invalid userRole name",
        },
        {
            id: "tocVqzvmpI0",
            name: "userRole name",
        },
    ],
    selftRefistered: false,
    phoneNumber: "",
    passwordLastUpdated: "",
};

export const fakeUserWithoutUserGroup: PermissionFixerUser = {
    //lastUpdated: "2024-09-16T14:51:06.958",
    id: "CHbcHcmgoZ5",
    //href: "https://server/api/users/CHbcHcmgoZ5",
    //created: "2018-05-02T11:33:24.434",
    //lastLogin: "2024-09-16T14:51:06.955",
    twoFA: false,
    invitation: false,
    //selfRegistered: false,
    firstName: "Fake",
    name: "Fake Dummy",
    favorite: false,
    //openId: "dummy@email.com",
    displayName: "Fake Dummy",
    externalAuth: false,
    externalAccess: false,
    surname: "Dummy",
    disabled: false,
    email: "dummy@email.com",
    username: "userusername",
    lastUpdatedBy: {
        displayName: "fake complete name",
        name: "fake complete name",
        id: "TuqkLj1igOH",
        username: "fakeusername",
    },
    userCredentials: {
        //openId: "dummy@email.com",
        lastLogin: "2024-09-16T14:51:06.955",
        invitation: false,
        disabled: false,
        twoFA: false,
        username: "userusername",
        userRoles: [
            {
                id: "tocVqzvmpI0",
                name: "userRole name",
            },
        ],
        //this is a bit different in 2.38.7
        lastUpdated: "",
        passwordLastUpdated: "",
        selfRegisterd: false,
        uid: "",
        twoFactorEnabled: false,
    },
    createdBy: {
        displayName: "fake complete name",
        name: "fake complete name",
        id: "TuqkLj1igOH",
        username: "fakeusername",
    },
    userGroups: [],
    userRoles: [
        {
            id: "tocVqzvmpI0",
            name: "userRole name",
        },
    ],
    selftRefistered: false,
    phoneNumber: "",
    passwordLastUpdated: "",
};

export const fakeUserWithOnlyNotTemplateUserGroup: PermissionFixerUser = {
    //lastUpdated: "2024-09-16T14:51:06.958",
    id: "CHbcHcmgoZ5",
    //href: "https://server/api/users/CHbcHcmgoZ5",
    //created: "2018-05-02T11:33:24.434",
    //lastLogin: "2024-09-16T14:51:06.955",
    twoFA: false,
    invitation: false,
    //selfRegistered: false,
    firstName: "Fake",
    name: "Fake Dummy",
    favorite: false,
    //openId: "dummy@email.com",
    displayName: "Fake Dummy",
    externalAuth: false,
    externalAccess: false,
    surname: "Dummy",
    disabled: false,
    email: "dummy@email.com",
    username: "userusername",
    lastUpdatedBy: {
        displayName: "fake complete name",
        name: "fake complete name",
        id: "TuqkLj1igOH",
        username: "fakeusername",
    },
    userCredentials: {
        //openId: "dummy@email.com",
        lastLogin: "2024-09-16T14:51:06.955",
        invitation: false,
        disabled: false,
        twoFA: false,
        username: "userusername",
        userRoles: [
            {
                id: "tocVqzvmpI0",
                name: "userRole name",
            },
        ],
        //this is a bit different in 2.38.7
        lastUpdated: "",
        passwordLastUpdated: "",
        selfRegisterd: false,
        uid: "",
        twoFactorEnabled: false,
    },
    createdBy: {
        displayName: "fake complete name",
        name: "fake complete name",
        id: "TuqkLj1igOH",
        username: "fakeusername",
    },
    userGroups: [
        {
            id: "dhWMtH5yC2h_no_template",
            name: "normal userGroup name",
        },
    ],
    userRoles: [
        {
            id: "tocVqzvmpI0",
            name: "userRole name",
        },
    ],
    selftRefistered: false,
    phoneNumber: "",
    passwordLastUpdated: "",
};

export const templateGroupsExtended: PermissionFixerTemplateGroupExtended = {
    group: {
        id: "dhWMtH5yC2h",
        name: "userGroup name",
    },
    template: {
        id: "dhWMtH5yC2h_user",
        name: "template user username",
    },
    validRolesByAuthority: [],
    invalidRolesByAuthority: [],
    validRolesById: [],
    invalidRolesById: [],
};

export const permissionFixerTemplateGroupExtended: PermissionFixerTemplateGroupExtended = {
    group: { id: "dhWMtH5yC2h", name: "userGroup name" },
    template: { id: "dhWMtH5yC2h_user", name: "template user username" },
    validRolesByAuthority: [
        {
            id: "BQEME6bsUpZ",
            name: "Dummy authority",
            authorities: ["VALID_AUTH", "OTHER_VALID_AUTH"],
        },
    ],
    invalidRolesByAuthority: [
        {
            id: "invalidRoleId",
            authorities: ["INVALID_AUTH"],
            name: "Invalid dummy role",
        },
    ],
    validRolesById: ["BQEME6bsUpZ"],
    invalidRolesById: ["invalidRoleId"],
};
/* 
export const config: PermissionFixerConfig = {
    pushReport: true,
    pushFixedUsersRoles: true,
    pushFixedUserGroups: true,
    forceMinimalGroupForUsersWithoutGroup: true,
};

export const configFixUserGroupDisabled: PermissionFixerConfig = {
    pushReport: true,
    pushFixedUsersRoles: true,
    pushFixedUserGroups: true,
    forceMinimalGroupForUsersWithoutGroup: false,
};

export const metadataConfigDisabledUsergroupFix: PermissionFixerMetadataConfig = {
    templates: [templateGroup],
    excludedRoles: [],
    excludedUsers: [],
    excludedRolesByUser: [],
    excludedRolesByGroup: [],
    excludedRolesByRole: [],
    pushProgram: {
        id: "IKpEgoQ4S0r",
        name: "Event program uid",
    },
    minimalGroup: {
        id: "IKpEgoQ4S02",
        name: "Minimal group uid",
    },
    minimalRole: {
        id: "IKpEgoQ4S03",
        name: "Minimal role uid",
    },
    permissionFixerConfig: configFixUserGroupDisabled,
};
export const metadataConfigWrongMinimaLUserGroup: PermissionFixerMetadataConfig = {
    templates: [templateGroup],
    excludedRoles: [],
    excludedUsers: [],
    excludedRolesByUser: [],
    excludedRolesByGroup: [],
    excludedRolesByRole: [],
    pushProgram: {
        id: "IKpEgoQ4S0r",
        name: "Event program uid",
    },
    minimalGroup: {
        id: "IKpEgoQ4S03",
        name: "WrongMinimal group uid",
    },
    minimalRole: {
        id: "IKpEgoQ4S03",
        name: "Minimal role uid",
    },
    permissionFixerConfig: config,
};
export const metadataConfigEnabledUsergroupFix: PermissionFixerMetadataConfig = {
    templates: [templateGroup],
    excludedRoles: [],
    excludedUsers: [],
    excludedRolesByUser: [],
    excludedRolesByGroup: [],
    excludedRolesByRole: [],
    pushProgram: {
        id: "IKpEgoQ4S0r",
        name: "Event program uid",
    },
    minimalGroup: {
        id: "IKpEgoQ4S02",
        name: "Minimal group uid",
    },
    minimalRole: {
        id: "IKpEgoQ4S03",
        name: "Minimal role uid",
    },
    permissionFixerConfig: config,
};

export const metadataConfig: PermissionFixerMetadataConfig = {
    templates: [templateGroup],
    excludedRoles: [],
    excludedUsers: [],
    excludedRolesByUser: [],
    excludedRolesByGroup: [],
    excludedRolesByRole: [],

    pushProgram: {
        id: "IKpEgoQ4S0r",
        name: "Event program uid",
    },
    minimalGroup: {
        id: "IKpEgoQ4S02",
        name: "Minimal group uid",
    },
    minimalRole: {
        id: "IKpEgoQ4S03",
        name: "Minimal role uid",
    },
    permissionFixerConfig: config,
};


export const metadataConfigExcludedUser: PermissionFixerMetadataConfig = {
    templates: [templateGroup],
    excludedRoles: [],
    excludedUsers: [fakeValidUser],
    excludedRolesByUser: [],
    excludedRolesByGroup: [],
    excludedRolesByRole: [],

    pushProgram: {
        id: "IKpEgoQ4S0r",
        name: "Event program uid",
    },
    minimalGroup: {
        id: "IKpEgoQ4S02",
        name: "Minimal group uid",
    },
    minimalRole: {
        id: "IKpEgoQ4S03",
        name: "Minimal role uid",
    },
    permissionFixerConfig: config,
}; */


export const baseConfig: PermissionFixerConfig = {
    pushReport: true,
    pushFixedUsersRoles: true,
    pushFixedUserGroups: true,
    forceMinimalGroupForUsersWithoutGroup: true,
};

export const baseMetadataConfig: PermissionFixerMetadataConfig = {
    templates: [templateGroup],
    excludedRoles: [],
    excludedUsers: [],
    excludedRolesByUser: [],
    excludedRolesByGroup: [],
    excludedRolesByRole: [],
    pushProgram: {
        id: "IKpEgoQ4S0r",
        name: "Event program uid",
    },
    minimalGroup: {
        id: "IKpEgoQ4S02",
        name: "Minimal group uid",
    },
    minimalRole: {
        id: "IKpEgoQ4S03",
        name: "Minimal role uid",
    },
    permissionFixerConfig: baseConfig,
};
