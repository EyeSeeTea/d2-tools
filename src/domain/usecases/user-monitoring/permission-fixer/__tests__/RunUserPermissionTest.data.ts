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

export const fakeValidUser: PermissionFixerUser = {
    id: "CHbcHcmgoZ5",
    twoFA: false,
    invitation: false,
    firstName: "Fake",
    name: "Fake Dummy",
    favorite: false,
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
    id: "CHbcHcmgoZ5",
    twoFA: false,
    invitation: false,
    firstName: "Fake",
    name: "Fake Dummy",
    favorite: false,
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
        lastLogin: "2024-09-16T14:51:06.955",
        invitation: false,
        disabled: false,
        twoFA: false,
        username: "userusername",
        userRoles: [
            {
                id: "invalidRoleId",
                name: "Invalid dummy role",
            },
            {
                id: "BQEME6bsUpZ",
                name: "Dummy authority",
            },
        ],
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
            name: "Invalid dummy role",
        },
        {
            id: "BQEME6bsUpZ",
            name: "Dummy authority",
        },
    ],
    selftRefistered: false,
    phoneNumber: "",
    passwordLastUpdated: "",
};

export const fakeUserWithoutUserGroup: PermissionFixerUser = {
    id: "CHbcHcmgoZ5",
    twoFA: false,
    invitation: false,
    firstName: "Fake",
    name: "Fake Dummy",
    favorite: false,
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

export const permissionFixerTemplateGroupsExtended: PermissionFixerTemplateGroupExtended[] = [
    {
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
    },
    {
        group: { id: "minimalUID", name: "minimal user group" },
        template: { id: "Minimal_user", name: "minimal template user username" },
        validRolesByAuthority: [
            {
                id: "BASIC_UidZ",
                name: "Basic authority",
                authorities: ["BASIC_AUTH"],
            },
        ],
        invalidRolesByAuthority: [
            {
                id: "BQEME6bsUpZ",
                name: "Dummy authority",
                authorities: ["VALID_AUTH", "OTHER_VALID_AUTH"],
            },
            {
                id: "invalidRoleId",
                authorities: ["INVALID_AUTH"],
                name: "Invalid dummy role",
            },
        ],
        validRolesById: ["BASIC_UidZ"],
        invalidRolesById: ["invalidRoleId", "BQEME6bsUpZ"],
    },
];

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
        id: "minimalUID",
        name: "minimal user group",
    },
    minimalRole: {
        id: "IKpEgoQ4S03",
        name: "Minimal role uid",
    },
    permissionFixerConfig: baseConfig,
};
