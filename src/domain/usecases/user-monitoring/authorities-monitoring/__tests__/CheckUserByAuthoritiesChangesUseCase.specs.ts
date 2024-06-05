import { describe, it, expect } from "vitest";

import { auth1Users, auth2Users, noneUsers, twoAuthUsers } from "./AuthoritiesMonitoringTests.data";

import { CheckUserByAuthoritiesChangesUseCase } from "../CheckUserByAuthoritiesChangesUseCase";

describe("CheckUserByAuthoritiesChangesUseCase", () => {
    it("Should find no changes in the same UsersByAuthority object", async () => {
        const useCase = new CheckUserByAuthoritiesChangesUseCase();

        const { newUsers, usersLosingAuth } = await useCase.execute(twoAuthUsers, twoAuthUsers);

        expect(newUsers).toEqual(noChanges);
        expect(usersLosingAuth).toEqual(noChanges);
    });

    it("Should find users with new authorities", async () => {
        const useCase = new CheckUserByAuthoritiesChangesUseCase();

        const { newUsers, usersLosingAuth } = await useCase.execute(noneUsers, twoAuthUsers);

        expect(newUsers).toEqual(twoAuthUsers);
        expect(usersLosingAuth).toEqual(noChanges);
    });

    it("Should find users losing authorities", async () => {
        const useCase = new CheckUserByAuthoritiesChangesUseCase();

        const { newUsers, usersLosingAuth } = await useCase.execute(auth2Users, noneUsers);

        expect(newUsers).toEqual(noChanges);
        expect(usersLosingAuth).toEqual(auth2Users);
    });

    it("Should find new and losing types of changes", async () => {
        const useCase = new CheckUserByAuthoritiesChangesUseCase();

        const { newUsers, usersLosingAuth } = await useCase.execute(auth2Users, auth1Users);

        expect(newUsers).toEqual(auth1Users);
        expect(usersLosingAuth).toEqual(auth2Users);
    });

    it("Should find new, no change and losing types of changes", async () => {
        const useCase = new CheckUserByAuthoritiesChangesUseCase();

        const { newUsers, usersLosingAuth } = await useCase.execute(twoAuthUsers, auth1and2Users);

        expect(newUsers).toEqual(auth1Users);
        expect(usersLosingAuth).toEqual(auth3Users);
    });
});

const noChanges = {};

const auth1and2Users = {
    AUTH_1: auth1Users.AUTH_1 ? auth1Users.AUTH_1 : [],
    AUTH_2: auth2Users.AUTH_2 ? auth2Users.AUTH_2 : [],
};

const auth3Users = { AUTH_3: twoAuthUsers.AUTH_3 ? twoAuthUsers.AUTH_3 : [] };
