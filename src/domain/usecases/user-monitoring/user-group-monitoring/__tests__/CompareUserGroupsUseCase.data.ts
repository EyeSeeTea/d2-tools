import { UserGroup, UserGroupDiff } from "domain/entities/user-monitoring/user-group-monitoring/UserGroups";

export const emptyDiff: UserGroupDiff = {
    id: "UfhhwZK73Lg",
    name: "WIDP IT team",
    changedProps: {},
    newProps: {},
};

export const minimalUserGroup: UserGroup = {
    id: "UfhhwZK73Lg",
    name: "WIDP IT team",
};

export const userGroup1: UserGroup = {
    created: "2020-01-06T09:56:43.579",
    lastUpdated: "2024-06-10T21:31:09.850",
    name: "WIDP IT team",
    id: "UfhhwZK73Lg",
    href: "http://localhost:8080/api/userGroups/UfhhwZK73Lg",
    displayName: "WIDP IT team",
    publicAccess: "--------",
    externalAccess: false,
    favorite: false,
    lastUpdatedBy: {
        displayName: "Ignacio del Cano Costa",
        name: "Ignacio del Cano Costa",
        id: "kD52FGwJgDF",
        username: "idelcano",
    },
    access: {
        read: true,
        update: true,
        externalize: true,
        write: true,
        delete: true,
        manage: true,
    },
    sharing: {
        owner: "ilJDyuqlwDC",
        userGroups: {
            L2K8KDwssiB: {
                displayName: "NTD user management",
                access: "r-------",
                id: "L2K8KDwssiB",
            },
            L5dlGQ4m5av: {
                displayName: "WIDP User Manager",
                access: "r-------",
                id: "L5dlGQ4m5av",
            },
            UfhhwZK73Lg: {
                displayName: "WIDP IT team",
                access: "rw------",
                id: "UfhhwZK73Lg",
            },
            sCjEPgiOhP1: {
                displayName: "WIDP admins",
                access: "r-------",
                id: "sCjEPgiOhP1",
            },
        },
        external: false,
        public: "--------",
        users: {},
    },
    createdBy: {
        displayName: "Lise GROUT",
        name: "Lise GROUT",
        id: "ilJDyuqlwDC",
        username: "lise.grout",
    },
    user: {
        displayName: "Lise GROUT",
        name: "Lise GROUT",
        id: "ilJDyuqlwDC",
        username: "lise.grout",
    },
    favorites: [],
    userGroupAccesses: [
        {
            access: "r-------",
            userGroupUid: "L2K8KDwssiB",
            displayName: "NTD user management",
            id: "L2K8KDwssiB",
        },
        {
            access: "r-------",
            userGroupUid: "L5dlGQ4m5av",
            displayName: "WIDP User Manager",
            id: "L5dlGQ4m5av",
        },
        {
            access: "r-------",
            userGroupUid: "sCjEPgiOhP1",
            displayName: "WIDP admins",
            id: "sCjEPgiOhP1",
        },
        {
            access: "rw------",
            userGroupUid: "UfhhwZK73Lg",
            displayName: "WIDP IT team",
            id: "UfhhwZK73Lg",
        },
    ],
    managedByGroups: [
        {
            id: "JusJWdDa1LM",
        },
    ],
    attributeValues: [],
    users: [
        {
            name: "Foche Ignacio",
            id: "H4atNsEuKxP",
        },
        {
            name: "Nazar Shandra",
            id: "hfaMYUsDm8u",
        },
        {
            name: "Marc GARNICA CAPARROS",
            id: "UrYtDCrhioH",
        },
        {
            name: "Pablo Foche",
            id: "Qu9goywu6cV",
        },
        {
            name: "Bot Basic access",
            id: "QiUHDbdHdBU",
        },
        {
            name: "user dev",
            id: "smGarTiKDdV",
        },
        {
            name: "Bot Automated-Tasks",
            id: "bI1uY3KuAKV",
        },
    ],
    managedGroups: [],
    translations: [],
    userAccesses: [],
};
