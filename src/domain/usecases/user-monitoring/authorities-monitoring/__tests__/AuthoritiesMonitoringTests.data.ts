import { UsersByAuthority } from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";

export const auth1Users: UsersByAuthority = {
    AUTH_1: [
        {
            id: "cNtWc18LXBS",
            username: "user auth1 1",
            userRoles: [
                {
                    id: "FdKbkgGda2o",
                    name: "auth1UserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKxP",
            username: "user auth1 2",
            userRoles: [
                {
                    id: "FdKbkgGda2o",
                    name: "auth1UserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKxW",
            username: "user auth1_2 1",
            userRoles: [
                {
                    id: "FdKbkgGda2o",
                    name: "auth1UserRole",
                },
            ],
        },
    ],
};

export const auth2Users: UsersByAuthority = {
    AUTH_2: [
        {
            id: "cNtWc18LXBS",
            username: "user auth1 1",
            userRoles: [
                {
                    id: "FdKbkgGda2o",
                    name: "auth1UserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKxP",
            username: "user auth1 2",
            userRoles: [
                {
                    id: "FdKbkgGda2o",
                    name: "auth1UserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKxW",
            username: "user auth1_2 1",
            userRoles: [
                {
                    id: "FdKbkgGda2o",
                    name: "auth1UserRole",
                },
                {
                    id: "FdKbkgGda21",
                    name: "auth2UserRole",
                },
            ],
        },
        {
            id: "cNtWc18LXB1",
            username: "user auth2 1",
            userRoles: [
                {
                    id: "FdKbkgGda21",
                    name: "auth2UserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKx1",
            username: "user auth2 2",
            userRoles: [
                {
                    id: "FdKbkgGda21",
                    name: "auth2UserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKxQ",
            username: "user auth2_3 1",
            userRoles: [
                {
                    id: "FdKbkgGda21",
                    name: "auth2UserRole",
                },
            ],
        },
    ],
};

export const twoAuthUsers: UsersByAuthority = {
    AUTH_2: auth2Users.AUTH_2 ? auth2Users.AUTH_2 : [],
    AUTH_3: [
        {
            id: "cNtWc18LXB2",
            username: "user auth3 1",
            userRoles: [
                {
                    id: "FdKbkgGda22",
                    name: "auth3UserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKx2",
            username: "user auth3 2",
            userRoles: [
                {
                    id: "FdKbkgGda22",
                    name: "auth3UserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKxQ",
            username: "user auth2_3 1",
            userRoles: [
                {
                    id: "FdKbkgGda22",
                    name: "auth3UserRole",
                },
            ],
        },
    ],
};

export const allAuthUsers: UsersByAuthority = {
    AUTH_1: auth1Users.AUTH_1 ? auth1Users.AUTH_1 : [],
    AUTH_2: auth2Users.AUTH_2 ? auth2Users.AUTH_2 : [],
    AUTH_3: [
        {
            id: "cNtWc18LXB2",
            username: "user auth3 1",
            userRoles: [
                {
                    id: "FdKbkgGda22",
                    name: "auth3UserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKx2",
            username: "user auth3 2",
            userRoles: [
                {
                    id: "FdKbkgGda22",
                    name: "auth3UserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKxQ",
            username: "user auth2_3 1",
            userRoles: [
                {
                    id: "FdKbkgGda22",
                    name: "auth3UserRole",
                },
            ],
        },
    ],
};

export const noneUsers: UsersByAuthority = {
    NONE: [],
};
