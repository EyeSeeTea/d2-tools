import { mock, when, instance } from "ts-mockito";
import { describe, it, expect } from "vitest";

import { UserRolesD2Repository } from "data/user-monitoring/authorities-monitoring/UserRolesD2Repository";

import { UserRole } from "domain/entities/user-monitoring/UserRole";
import {
    AuthoritiesMonitoringOptions,
    UsersByAuthority,
} from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";

import { GetUsersByAuthoritiesUseCase } from "../GetUsersByAuthoritiesUseCase";

function givenAStubUserRolesRepository() {
    const mockedRepository = mock(UserRolesD2Repository);
    when(mockedRepository.getByAuthorities(auth1UsersDatastore.authoritiesToMonitor)).thenReturn(
        Promise.resolve([auth1UserRole])
    );
    when(mockedRepository.getByAuthorities(auth2UsersDatastore.authoritiesToMonitor)).thenReturn(
        Promise.resolve([auth1UserRole, auth2UserRole])
    );
    when(mockedRepository.getByAuthorities(twoAuthUsersDatastore.authoritiesToMonitor)).thenReturn(
        Promise.resolve([auth1UserRole, auth2UserRole, auth3UserRole])
    );
    when(mockedRepository.getByAuthorities(noUsersDatastore.authoritiesToMonitor)).thenReturn(
        Promise.resolve([noneUserRole])
    );
    const userRolesRepository = instance(mockedRepository);

    return userRolesRepository;
}

describe("GetUsersByAuthoritiesUseCase", () => {
    it("Should retrieve users for single userRole auth", async () => {
        const useCase = new GetUsersByAuthoritiesUseCase(givenAStubUserRolesRepository());

        const result = await useCase.execute(auth1UsersDatastore);

        expect(result).toEqual(auth1Users);
    });

    it("Should retrieve users for multi userRole auth", async () => {
        const useCase = new GetUsersByAuthoritiesUseCase(givenAStubUserRolesRepository());

        const result = await useCase.execute(auth2UsersDatastore);

        expect(result).toEqual(auth2Users);
    });

    it("Should retrieve users for multiple auths", async () => {
        const useCase = new GetUsersByAuthoritiesUseCase(givenAStubUserRolesRepository());

        const result = await useCase.execute(twoAuthUsersDatastore);

        expect(result).toEqual(twoAuthUsers);
    });

    it("Should handle user role with no users", async () => {
        const useCase = new GetUsersByAuthoritiesUseCase(givenAStubUserRolesRepository());

        const result = await useCase.execute(noUsersDatastore);

        expect(result).toEqual(noneUsers);
    });
});

// DATA

const auth1UsersDatastore: AuthoritiesMonitoringOptions = {
    authoritiesToMonitor: ["AUTH_1"],
    lastExecution: "2024-05-28T22:14:36,492",
    usersByAuthority: {},
};

const auth2UsersDatastore: AuthoritiesMonitoringOptions = {
    authoritiesToMonitor: ["AUTH_2"],
    lastExecution: "2024-05-28T22:14:36,492",
    usersByAuthority: {},
};

const twoAuthUsersDatastore: AuthoritiesMonitoringOptions = {
    authoritiesToMonitor: ["AUTH_2", "AUTH_3"],
    lastExecution: "2024-05-28T22:14:36,492",
    usersByAuthority: {},
};

const noUsersDatastore: AuthoritiesMonitoringOptions = {
    authoritiesToMonitor: ["NONE"],
    lastExecution: "2024-05-28T22:14:36,492",
    usersByAuthority: {},
};

const auth1Users: UsersByAuthority = {
    AUTH_1: [
        {
            id: "cNtWc18LXBS",
            name: "user auth1 1",
            userRoles: [
                {
                    id: "FdKbkgGda2o",
                    name: "allUserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKxP",
            name: "user auth1 2",
            userRoles: [
                {
                    id: "FdKbkgGda2o",
                    name: "allUserRole",
                },
            ],
        },
    ],
};

const auth2Users: UsersByAuthority = {
    AUTH_2: [
        {
            id: "cNtWc18LXBS",
            name: "user auth1 1",
            userRoles: [
                {
                    id: "FdKbkgGda2o",
                    name: "allUserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKxP",
            name: "user auth1 2",
            userRoles: [
                {
                    id: "FdKbkgGda2o",
                    name: "allUserRole",
                },
            ],
        },
        {
            id: "cNtWc18LXB1",
            name: "user auth2 1",
            userRoles: [
                {
                    id: "FdKbkgGda21",
                    name: "someUserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKx1",
            name: "user auth2 2",
            userRoles: [
                {
                    id: "FdKbkgGda21",
                    name: "someUserRole",
                },
            ],
        },
    ],
};

const twoAuthUsers: UsersByAuthority = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    AUTH_2: auth2Users["AUTH_2"]!,
    AUTH_3: [
        {
            id: "cNtWc18LXB2",
            name: "user auth3 1",
            userRoles: [
                {
                    id: "FdKbkgGda22",
                    name: "almostAllUserRole",
                },
            ],
        },
        {
            id: "H4atNsEuKx2",
            name: "user auth3 2",
            userRoles: [
                {
                    id: "FdKbkgGda22",
                    name: "almostAllUserRole",
                },
            ],
        },
    ],
};

const noneUsers: UsersByAuthority = {
    NONE: [],
};

const auth1UserRole: UserRole = {
    name: "allUserRole",
    id: "FdKbkgGda2o",
    authorities: ["AUTH_2", "AUTH_1"],
    users: [
        {
            id: "cNtWc18LXBS",
            name: "user auth1 1",
        },
        {
            id: "H4atNsEuKxP",
            name: "user auth1 2",
        },
    ],
};

const auth2UserRole: UserRole = {
    name: "someUserRole",
    id: "FdKbkgGda21",
    authorities: ["AUTH_2"],
    users: [
        {
            id: "cNtWc18LXB1",
            name: "user auth2 1",
        },
        {
            id: "H4atNsEuKx1",
            name: "user auth2 2",
        },
    ],
};

const auth3UserRole: UserRole = {
    name: "almostAllUserRole",
    id: "FdKbkgGda22",
    authorities: ["AUTH_3"],
    users: [
        {
            id: "cNtWc18LXB2",
            name: "user auth3 1",
        },
        {
            id: "H4atNsEuKx2",
            name: "user auth3 2",
        },
    ],
};

const noneUserRole: UserRole = {
    name: "noneUserRole",
    id: "FdKbkgGda23",
    authorities: ["NONE"],
    users: [],
};
