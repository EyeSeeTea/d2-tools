import { User, UserTemplateDiff } from "domain/entities/user-monitoring/user-templates-monitoring/Users";

export const user1: User = {
    lastUpdated: "2024-06-10T10:25:27.228",
    id: "cNtWc18LXBS",
    created: "2018-06-09T01:05:48.008",
    twoFA: false,
    invitation: false,
    selfRegistered: false,
    firstName: "User Template",
    name: "User Template",
    favorite: false,
    displayName: "User Template",
    externalAuth: false,
    externalAccess: false,
    surname: "User",
    disabled: true,
    username: "user.template",
    lastUpdatedBy: {
        displayName: "User",
        name: "User",
        id: "user_id",
        username: "user",
    },
    sharing: {
        userGroups: {},
        external: false,
        users: {},
    },
    access: {
        read: true,
        update: true,
        externalize: true,
        write: true,
        delete: true,
        manage: true,
    },
    userCredentials: {
        externalAuth: false,
        disabled: true,
        id: "cNtWc18LXBS",
        twoFA: false,
        invitation: false,
        selfRegistered: false,
        username: "user.template",
        access: {
            read: true,
            update: true,
            externalize: true,
            write: true,
            delete: true,
            manage: true,
        },
        sharing: {
            userGroups: {},
            external: false,
            users: {},
        },
        cogsDimensionConstraints: [],
        catDimensionConstraints: [],
        previousPasswords: [],
    },
    createdBy: {
        displayName: "User",
        name: "User",
        id: "user_id",
        username: "user",
    },
    user: {
        displayName: "User",
        name: "User",
        id: "user_id",
        username: "user",
    },
    translations: [],
    dataViewOrganisationUnits: [
        {
            id: "org_unit_id",
        },
    ],
    userGroupAccesses: [],
    attributeValues: [],
    userGroups: [
        {
            name: "User Group 1",
            id: "user_group_id_1",
        },
        {
            name: "User Group 2",
            id: "user_group_id_2",
        },
    ],
    userRoles: [
        {
            name: "Role 1",
            id: "role_id_1",
        },
        {
            name: "Role 2",
            id: "role_id_2",
        },
        {
            name: "Role 3",
            id: "role_id_3",
        },
    ],
    userAccesses: [],
    favorites: [],
    cogsDimensionConstraints: [],
    catDimensionConstraints: [],
    teiSearchOrganisationUnits: [],
    organisationUnits: [
        {
            id: "org_unit_id",
        },
    ],
};

export const user1Updated: User = {
    lastUpdated: "2024-06-11T10:25:27.228",
    id: "cNtWc18LXBS",
    created: "2018-06-09T01:05:48.008",
    twoFA: true,
    invitation: true,
    selfRegistered: true,
    firstName: "Updated User Template",
    name: "Updated User Template",
    favorite: true,
    displayName: "Updated User Template",
    externalAuth: true,
    externalAccess: true,
    surname: "Updated User",
    disabled: false,
    username: "user.template",
    lastUpdatedBy: {
        displayName: "Updated User",
        name: "Updated User",
        id: "updated_user_id",
        username: "updated_user",
    },
    sharing: {
        userGroups: {},
        external: true,
        users: {},
    },
    access: {
        read: false,
        update: false,
        externalize: false,
        write: false,
        delete: false,
        manage: false,
    },
    userCredentials: {
        externalAuth: true,
        disabled: false,
        id: "cNtWc18LXBS",
        twoFA: true,
        invitation: true,
        selfRegistered: true,
        username: "user.template",
        access: {
            read: false,
            update: false,
            externalize: false,
            write: false,
            delete: false,
            manage: false,
        },
        sharing: {
            userGroups: {},
            external: true,
            users: {},
        },
        cogsDimensionConstraints: [],
        catDimensionConstraints: [],
        previousPasswords: [],
    },
    createdBy: {
        displayName: "Updated User",
        name: "Updated User",
        id: "updated_user_id",
        username: "updated_user",
    },
    user: {
        displayName: "Updated User",
        name: "Updated User",
        id: "updated_user_id",
        username: "updated_user",
    },
    translations: [],
    dataViewOrganisationUnits: [
        {
            id: "updated_org_unit_id",
        },
    ],
    userGroupAccesses: [],
    attributeValues: [],
    userGroups: [
        {
            name: "Updated User Group 1",
            id: "updated_user_group_id_1",
        },
        {
            name: "Updated User Group 2",
            id: "updated_user_group_id_2",
        },
    ],
    userRoles: [
        {
            name: "Updated Role 1",
            id: "updated_role_id_1",
        },
        {
            name: "Updated Role 2",
            id: "updated_role_id_2",
        },
        {
            name: "Updated Role 3",
            id: "updated_role_id_3",
        },
    ],
    userAccesses: [],
    favorites: [],
    cogsDimensionConstraints: [],
    catDimensionConstraints: [],
    teiSearchOrganisationUnits: [],
    organisationUnits: [
        {
            id: "updated_org_unit_id",
        },
    ],
};

export const noChangesDiff: UserTemplateDiff = {
    id: user1.id,
    username: user1.username,
    changedPropsLost: {},
    changedPropsAdded: {},
    membershipChanges: {
        userRolesLost: [],
        userRolesAdded: [],
        userGroupsLost: [],
        userGroupsAdded: [],
    },
    newProps: {},
};

export const expectedDiff: UserTemplateDiff = {
    id: "cNtWc18LXBS",
    username: "user.template",
    changedPropsLost: {
        lastUpdated: "2024-06-10T10:25:27.228",
        twoFA: false,
        invitation: false,
        selfRegistered: false,
        firstName: "User Template",
        name: "User Template",
        favorite: false,
        displayName: "User Template",
        externalAuth: false,
        externalAccess: false,
        surname: "User",
        disabled: true,
        lastUpdatedBy: {
            displayName: "User",
            name: "User",
            id: "user_id",
            username: "user",
        },
        sharing: {
            userGroups: {},
            external: false,
            users: {},
        },
        access: {
            read: true,
            update: true,
            externalize: true,
            write: true,
            delete: true,
            manage: true,
        },
        userCredentials: {
            externalAuth: false,
            disabled: true,
            id: "cNtWc18LXBS",
            twoFA: false,
            invitation: false,
            selfRegistered: false,
            username: "user.template",
            access: {
                read: true,
                update: true,
                externalize: true,
                write: true,
                delete: true,
                manage: true,
            },
            sharing: {
                userGroups: {},
                external: false,
                users: {},
            },
            cogsDimensionConstraints: [],
            catDimensionConstraints: [],
            previousPasswords: [],
        },
        createdBy: {
            displayName: "User",
            name: "User",
            id: "user_id",
            username: "user",
        },
        user: {
            displayName: "User",
            name: "User",
            id: "user_id",
            username: "user",
        },
        dataViewOrganisationUnits: [
            {
                id: "org_unit_id",
            },
        ],
        organisationUnits: [
            {
                id: "org_unit_id",
            },
        ],
    },
    changedPropsAdded: {
        lastUpdated: "2024-06-11T10:25:27.228",
        twoFA: true,
        invitation: true,
        selfRegistered: true,
        firstName: "Updated User Template",
        name: "Updated User Template",
        favorite: true,
        displayName: "Updated User Template",
        externalAuth: true,
        externalAccess: true,
        surname: "Updated User",
        disabled: false,
        lastUpdatedBy: {
            displayName: "Updated User",
            name: "Updated User",
            id: "updated_user_id",
            username: "updated_user",
        },
        sharing: {
            userGroups: {},
            external: true,
            users: {},
        },
        access: {
            read: false,
            update: false,
            externalize: false,
            write: false,
            delete: false,
            manage: false,
        },
        userCredentials: {
            externalAuth: true,
            disabled: false,
            id: "cNtWc18LXBS",
            twoFA: true,
            invitation: true,
            selfRegistered: true,
            username: "user.template",
            access: {
                read: false,
                update: false,
                externalize: false,
                write: false,
                delete: false,
                manage: false,
            },
            sharing: {
                userGroups: {},
                external: true,
                users: {},
            },
            cogsDimensionConstraints: [],
            catDimensionConstraints: [],
            previousPasswords: [],
        },
        createdBy: {
            displayName: "Updated User",
            name: "Updated User",
            id: "updated_user_id",
            username: "updated_user",
        },
        user: {
            displayName: "Updated User",
            name: "Updated User",
            id: "updated_user_id",
            username: "updated_user",
        },
        dataViewOrganisationUnits: [
            {
                id: "updated_org_unit_id",
            },
        ],
        organisationUnits: [
            {
                id: "updated_org_unit_id",
            },
        ],
    },
    membershipChanges: {
        userRolesLost: [
            {
                name: "Role 1",
                id: "role_id_1",
            },
            {
                name: "Role 2",
                id: "role_id_2",
            },
            {
                name: "Role 3",
                id: "role_id_3",
            },
        ],
        userRolesAdded: [
            {
                name: "Updated Role 1",
                id: "updated_role_id_1",
            },
            {
                name: "Updated Role 2",
                id: "updated_role_id_2",
            },
            {
                name: "Updated Role 3",
                id: "updated_role_id_3",
            },
        ],
        userGroupsLost: [
            {
                name: "User Group 1",
                id: "user_group_id_1",
            },
            {
                name: "User Group 2",
                id: "user_group_id_2",
            },
        ],
        userGroupsAdded: [
            {
                name: "Updated User Group 1",
                id: "updated_user_group_id_1",
            },
            {
                name: "Updated User Group 2",
                id: "updated_user_group_id_2",
            },
        ],
    },
    newProps: {},
};
