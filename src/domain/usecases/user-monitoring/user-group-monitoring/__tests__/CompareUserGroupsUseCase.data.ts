import { UserGroup, UserGroupDiff } from "domain/entities/user-monitoring/user-group-monitoring/UserGroups";

export const emptyDiff: UserGroupDiff = {
    id: "QW4BriFFvLi",
    name: "WIDP IT team",
    changedPropsLost: {},
    changedPropsAdded: {},
    usersChanges: {
        users_Lost: [],
        users_Added: [],
    },
    newProps: {},
};

export const minimalUserGroup: UserGroup = {
    id: "QW4BriFFvLi",
    name: "WIDP IT team",
};

export const userGroup1: UserGroup = {
    created: "2020-01-06T09:56:43.579",
    lastUpdated: "2024-06-10T21:31:09.850",
    name: "Tech Team Alpha",
    id: "id123",
    href: "http://example.com/api/userGroups/id123",
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
