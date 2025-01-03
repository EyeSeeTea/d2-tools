import { mock, when, instance } from "ts-mockito";
import { describe, it, expect } from "vitest";
import { auth1Users, auth2Users, noneUsers, allAuthUsers } from "./AuthoritiesMonitoringTests.data";

import { UserRolesD2Repository } from "data/user-monitoring/authorities-monitoring/UserRolesD2Repository";

import { UserRole } from "domain/entities/user-monitoring/authorities-monitoring/UserRole";
import { AuthoritiesMonitoringOptions } from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";

import { GetUsersByAuthoritiesUseCase } from "../GetUsersByAuthoritiesUseCase";

function givenAStubUserRolesRepository() {
    const mockedRepository = mock(UserRolesD2Repository);
    when(mockedRepository.getByAuthorities(auth1UsersDatastore.authoritiesToMonitor)).thenReturn(
        Promise.resolve([auth1UserRole])
    );
    when(mockedRepository.getByAuthorities(auth2UsersDatastore.authoritiesToMonitor)).thenReturn(
        Promise.resolve([auth1UserRole, auth2UserRole])
    );
    when(mockedRepository.getByAuthorities(allAuthUsersDatastore.authoritiesToMonitor)).thenReturn(
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

        const result = await useCase.execute(allAuthUsersDatastore);

        expect(result).toEqual(allAuthUsers);
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

const allAuthUsersDatastore: AuthoritiesMonitoringOptions = {
    authoritiesToMonitor: ["AUTH_1", "AUTH_2", "AUTH_3"],
    lastExecution: "2024-05-28T22:14:36,492",
    usersByAuthority: {},
};

const noUsersDatastore: AuthoritiesMonitoringOptions = {
    authoritiesToMonitor: ["NONE"],
    lastExecution: "2024-05-28T22:14:36,492",
    usersByAuthority: {},
};

const auth1UserRole: UserRole = {
    name: "auth1UserRole",
    id: "FdKbkgGda2o",
    authorities: ["AUTH_2", "AUTH_1"],
    users: [
        {
            id: "cNtWc18LXBS",
            username: "user auth1 1",
        },
        {
            id: "H4atNsEuKxP",
            username: "user auth1 2",
        },
        {
            id: "H4atNsEuKxW",
            username: "user auth1_2 1",
        },
    ],
};

const auth2UserRole: UserRole = {
    name: "auth2UserRole",
    id: "FdKbkgGda21",
    authorities: ["AUTH_2"],
    users: [
        {
            id: "cNtWc18LXB1",
            username: "user auth2 1",
        },
        {
            id: "H4atNsEuKx1",
            username: "user auth2 2",
        },
        {
            id: "H4atNsEuKxW",
            username: "user auth1_2 1",
        },
        {
            id: "H4atNsEuKxQ",
            username: "user auth2_3 1",
        },
    ],
};

const auth3UserRole: UserRole = {
    name: "auth3UserRole",
    id: "FdKbkgGda22",
    authorities: ["AUTH_3"],
    users: [
        {
            id: "cNtWc18LXB2",
            username: "user auth3 1",
        },
        {
            id: "H4atNsEuKx2",
            username: "user auth3 2",
        },
        {
            id: "H4atNsEuKxQ",
            username: "user auth2_3 1",
        },
    ],
};

const noneUserRole: UserRole = {
    name: "noneUserRole",
    id: "FdKbkgGda23",
    authorities: ["NONE"],
    users: [],
};
