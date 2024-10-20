import { UserGroup, UserGroupDiff } from "domain/entities/user-monitoring/user-groups-monitoring/UserGroups";

export const emptyDiff: UserGroupDiff = {
    id: "id123",
    name: "Tech Team Alpha",
    changedPropsLost: {},
    changedPropsAdded: {},
    usersChanges: {
        usersLost: [],
        usersAdded: [],
    },
    newProps: {},
};

export const userGroup1Diff: UserGroupDiff = {
    id: "id123",
    name: "Tech Team Alpha",
    changedPropsLost: {
        displayName: "Tech Team Alpha",
        lastUpdatedBy: {
            displayName: "User Alpha",
            name: "User Alpha",
            id: "user01",
            username: "user.alpha",
        },
        sharing: {
            owner: "owner01",
            userGroups: {
                group01: {
                    displayName: "Project Management Team",
                    access: "r-------",
                    id: "group01",
                },
                group02: {
                    displayName: "Development Team",
                    access: "r-------",
                    id: "group02",
                },
                id123: {
                    displayName: "Tech Team Alpha",
                    access: "rw------",
                    id: "id123",
                },
                group03: {
                    displayName: "Operations Team",
                    access: "r-------",
                    id: "group03",
                },
            },
            external: false,
            public: "--------",
            users: {},
        },
        userGroupAccesses: [
            {
                access: "r-------",
                userGroupUid: "group01",
                displayName: "Project Management Team",
                id: "group01",
            },
            {
                access: "r-------",
                userGroupUid: "group02",
                displayName: "Development Team",
                id: "group02",
            },
            {
                access: "r-------",
                userGroupUid: "group03",
                displayName: "Operations Team",
                id: "group03",
            },
            {
                access: "rw------",
                userGroupUid: "id123",
                displayName: "Tech Team Alpha",
                id: "id123",
            },
        ],
    },
    changedPropsAdded: {
        displayName: "Tech Team Beta",
        lastUpdatedBy: {
            displayName: "User Beta",
            name: "User Beta",
            id: "user02",
            username: "user.beta",
        },
        sharing: {
            owner: "owner02",
            userGroups: {
                group01: {
                    displayName: "Project Management Team",
                    access: "r-------",
                    id: "group01",
                },
                group02: {
                    displayName: "Development Team",
                    access: "r-------",
                    id: "group02",
                },
                id456: {
                    displayName: "Tech Team Beta",
                    access: "rw------",
                    id: "id456",
                },
                group03: {
                    displayName: "Operations Team",
                    access: "r-------",
                    id: "group03",
                },
            },
            external: false,
            public: "--------",
            users: {},
        },
        userGroupAccesses: [
            {
                access: "r-------",
                userGroupUid: "group01",
                displayName: "Project Management Team",
                id: "group01",
            },
            {
                access: "r-------",
                userGroupUid: "group02",
                displayName: "Development Team",
                id: "group02",
            },
            {
                access: "r-------",
                userGroupUid: "group03",
                displayName: "Operations Team",
                id: "group03",
            },
            {
                access: "rw------",
                userGroupUid: "id456",
                displayName: "Tech Team Beta",
                id: "id456",
            },
        ],
    },
    usersChanges: {
        usersAdded: [
            {
                id: "user09",
                name: "Pat Robin",
            },
        ],
        usersLost: [
            {
                id: "user08",
                name: "Sam Robin",
            },
        ],
    },
    newProps: {},
};

export const minimalUserGroup: UserGroup = {
    id: "id123",
    name: "Tech Team Alpha",
    created: "2024-09-18T12:27:50.328",
    lastUpdated: "2024-09-18T12:27:50.358",
    createdBy: {
        id: "USER_ID_1",
        name: "John Doe",
        displayName: "John Doe",
        username: "admin",
    },
    favorites: [],
    lastUpdatedBy: {
        id: "USER_ID_1",
        name: "John Doe",
        displayName: "John Doe",
        username: "admin",
    },
    sharing: {
        owner: "USER_ID_1",
        external: false,
        users: {},
        userGroups: {},
        public: "rw------",
    },
    displayName: "TEST GROUP",
    access: {
        manage: true,
        externalize: false,
        write: true,
        read: true,
        update: true,
        delete: true,
    },
    favorite: false,
    user: {
        id: "USER_ID_1",
        name: "John Doe",
        displayName: "John Doe",
        username: "admin",
    },
    attributeValues: [],
    users: [],
    managedGroups: [],
    managedByGroups: [],
    translations: [],
};

export const userGroup1: UserGroup = {
    created: "2020-01-06T09:56:43.579",
    lastUpdated: "2024-06-10T21:31:09.850",
    name: "Tech Team Alpha",
    id: "id123",
    displayName: "Tech Team Alpha",
    publicAccess: "--------",
    externalAccess: false,
    favorite: false,
    lastUpdatedBy: {
        displayName: "User Alpha",
        name: "User Alpha",
        id: "user01",
        username: "user.alpha",
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
        owner: "owner01",
        userGroups: {
            group01: {
                displayName: "Project Management Team",
                access: "r-------",
                id: "group01",
            },
            group02: {
                displayName: "Development Team",
                access: "r-------",
                id: "group02",
            },
            id123: {
                displayName: "Tech Team Alpha",
                access: "rw------",
                id: "id123",
            },
            group03: {
                displayName: "Operations Team",
                access: "r-------",
                id: "group03",
            },
        },
        external: false,
        public: "--------",
        users: {},
    },
    createdBy: {
        displayName: "Alex Doe",
        name: "Alex Doe",
        id: "owner01",
        username: "alex.doe",
    },
    user: {
        displayName: "Alex Doe",
        name: "Alex Doe",
        id: "owner01",
        username: "alex.doe",
    },
    favorites: [],
    userGroupAccesses: [
        {
            access: "r-------",
            userGroupUid: "group01",
            displayName: "Project Management Team",
            id: "group01",
        },
        {
            access: "r-------",
            userGroupUid: "group02",
            displayName: "Development Team",
            id: "group02",
        },
        {
            access: "r-------",
            userGroupUid: "group03",
            displayName: "Operations Team",
            id: "group03",
        },
        {
            access: "rw------",
            userGroupUid: "id123",
            displayName: "Tech Team Alpha",
            id: "id123",
        },
    ],
    managedByGroups: [
        {
            id: "managerGroup01",
        },
    ],
    attributeValues: [],
    users: [
        {
            name: "John Smith",
            id: "user02",
        },
        {
            name: "Jane Doe",
            id: "user03",
        },
        {
            name: "Mike Johnson",
            id: "user04",
        },
        {
            name: "Emily Davis",
            id: "user05",
        },
        {
            name: "Chris Brown",
            id: "user06",
        },
        {
            name: "Pat Taylor",
            id: "user07",
        },
        {
            name: "Sam Robin",
            id: "user08",
        },
    ],
    managedGroups: [],
    translations: [],
    userAccesses: [],
};

export const userGroup1Updated: UserGroup = {
    created: "2020-01-06T09:56:43.579",
    lastUpdated: "2024-06-10T21:31:09.850",
    name: "Tech Team Alpha",
    id: "id123",
    displayName: "Tech Team Beta",
    publicAccess: "--------",
    externalAccess: false,
    favorite: false,
    lastUpdatedBy: {
        displayName: "User Beta",
        name: "User Beta",
        id: "user02",
        username: "user.beta",
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
        owner: "owner02",
        userGroups: {
            group01: {
                displayName: "Project Management Team",
                access: "r-------",
                id: "group01",
            },
            group02: {
                displayName: "Development Team",
                access: "r-------",
                id: "group02",
            },
            id456: {
                displayName: "Tech Team Beta",
                access: "rw------",
                id: "id456",
            },
            group03: {
                displayName: "Operations Team",
                access: "r-------",
                id: "group03",
            },
        },
        external: false,
        public: "--------",
        users: {},
    },
    createdBy: {
        displayName: "Alex Doe",
        name: "Alex Doe",
        id: "owner01",
        username: "alex.doe",
    },
    user: {
        displayName: "Alex Doe",
        name: "Alex Doe",
        id: "owner01",
        username: "alex.doe",
    },
    favorites: [],
    userGroupAccesses: [
        {
            access: "r-------",
            userGroupUid: "group01",
            displayName: "Project Management Team",
            id: "group01",
        },
        {
            access: "r-------",
            userGroupUid: "group02",
            displayName: "Development Team",
            id: "group02",
        },
        {
            access: "r-------",
            userGroupUid: "group03",
            displayName: "Operations Team",
            id: "group03",
        },
        {
            access: "rw------",
            userGroupUid: "id456",
            displayName: "Tech Team Beta",
            id: "id456",
        },
    ],
    managedByGroups: [
        {
            id: "managerGroup01",
        },
    ],
    attributeValues: [],
    users: [
        {
            name: "John Smith",
            id: "user02",
        },
        {
            name: "Jane Doe",
            id: "user03",
        },
        {
            name: "Mike Johnson",
            id: "user04",
        },
        {
            name: "Emily Davis",
            id: "user05",
        },
        {
            name: "Chris Brown",
            id: "user06",
        },
        {
            name: "Pat Taylor",
            id: "user07",
        },
        {
            name: "Pat Robin",
            id: "user09",
        },
    ],
    managedGroups: [],
    translations: [],
    userAccesses: [],
};
