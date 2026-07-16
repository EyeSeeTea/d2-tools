import { describe, it, expect } from "vitest";

import { RunTwoFactorReportUseCase } from "../RunTwoFactorReportUseCase";
import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { anything, deepEqual, instance, mock, when } from "ts-mockito";
import {
    listOfUsersOneValidOneInvalid,
    listOfUsersWithTwoInvalid,
    listOfUsersWithTwoValid,
    mixedInvalidUsers,
    userInTwoFAGroupButWithExternalAuth,
    userInvalidAuth,
    userWithoutExternalAuth,
    userWithoutTwoFA,
    userWithoutTwoFAdisabled,
    userWithTwoFA,
} from "./TwoFactorTest.data";
import { TwoFactorUserD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUserD2Repository";
import { TwoFactorReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorReportD2Repository";
import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import {
    TwoFactorUser,
    UserDateOverride,
    applyUserDateOverrides,
    filterByCreationDate,
} from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";
import { TwoFactorUserOptions } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserOptions";
const TWO_FACTOR_GROUP_ID = "2FA";
const WHO_ACCOUNT_GROUP_ID = "WHO";
const EXCEPTION_GROUP_ID = "EXC";

const baseUser = {
    externalAuth: false,
    disabled: false,
    twoFA: false,
    username: "testuser",
    created: "2020-01-01T00:00:00.000",
};

const defaultConfig: TwoFactorUserOptions = {
    pushProgram: { id: "program", name: "Program" },
    twoFactorGroup: { id: TWO_FACTOR_GROUP_ID, name: "2FA Group" },
    whoAccountGroup: { id: WHO_ACCOUNT_GROUP_ID, name: "WHO Group" },
    exceptionGroup: [{ id: EXCEPTION_GROUP_ID, name: "Exception Group" }],
    disableAfterMonths: undefined,
};
const alternativeConfig: TwoFactorUserOptions = {
    pushProgram: {
        id: "IKpEgoQ4S0r",
        name: "Event program uid",
    },
    twoFactorGroup: {
        id: "MkELexlZOj9",
        name: "TwoFactor usergroup",
    },
    whoAccountGroup: {
        id: "MkELexlZOj8",
        name: "Who account usergroup",
    },
    exceptionGroup: [],
    disableAfterMonths: undefined,
};

const useCaseOptionsDisabledFalse = { shouldDisableInvalidUsers: false, filteredByMonth: false };
const useCaseOptionsDisabledTrue = { shouldDisableInvalidUsers: true, filteredByMonth: false };

describe("TwoFactorReportUseCase", () => {
    it("Should detects a user in 2FA group with twoFA disabled as invalidTwoFA", async () => {
        const user: TwoFactorUser = {
            ...baseUser,
            id: "u1",
            userGroups: [{ id: TWO_FACTOR_GROUP_ID, name: "TwoFactorGroup" }],
        };

        const useCase = createUseCase({ users: [user], config: defaultConfig });

        const result = await useCase.execute({ shouldDisableInvalidUsers: false, filteredByMonth: false });

        expect(result.report.invalidTwoFAList).toEqual([{ id: "u1", name: "testuser" }]);
        expect(result.report.invalidWhoList).toEqual([]);
        expect(result.report.invalidAuthList).toEqual([]);
    });

    it("Should detects 0 users in 2FA group with twoFA enabled", async () => {
        const user: TwoFactorUser = {
            ...baseUser,
            id: "u1",
            twoFA: true,
            userGroups: [{ id: TWO_FACTOR_GROUP_ID, name: "TwoFactorGroup" }],
        };

        const useCase = createUseCase({ users: [user], config: defaultConfig });

        const result = await useCase.execute({ shouldDisableInvalidUsers: false, filteredByMonth: false });

        expect(result.report.invalidTwoFAList).toEqual([]);
        expect(result.report.invalidWhoList).toEqual([]);
        expect(result.report.invalidAuthList).toEqual([]);
    });

    it("Should detects a user in WHO group with externalAuth false as invalidWho", async () => {
        const user: TwoFactorUser = {
            ...baseUser,
            id: "u2",
            userGroups: [{ id: WHO_ACCOUNT_GROUP_ID, name: "" }],
        };
        const useCase = createUseCase({ users: [user], config: defaultConfig });

        const result = await useCase.execute(useCaseOptionsDisabledFalse);

        expect(result.report.invalidTwoFAList).toEqual([]);
        expect(result.report.invalidWhoList).toEqual([{ id: "u2", name: "testuser" }]);
        expect(result.report.invalidAuthList).toEqual([]);
    });

    it("Should ignores user in exception group even if invalid", async () => {
        const user: TwoFactorUser = {
            ...baseUser,
            id: "u3",
            userGroups: [{ id: EXCEPTION_GROUP_ID, name: "" }],
        };
        const useCase = createUseCase({ users: [user], config: defaultConfig });

        const result = await useCase.execute(useCaseOptionsDisabledFalse);

        expect(result.report.invalidTwoFAList).toEqual([]);
        expect(result.report.invalidWhoList).toEqual([]);
        expect(result.report.invalidAuthList).toEqual([]);
    });

    it("Should detects user not in 2FA nor WHO as invalidAuth", async () => {
        const user: TwoFactorUser = {
            ...baseUser,
            id: "u4",
            userGroups: [],
        };
        const useCase = createUseCase({ users: [user], config: defaultConfig });

        const result = await useCase.execute(useCaseOptionsDisabledFalse);

        expect(result.report.invalidTwoFAList).toEqual([]);
        expect(result.report.invalidWhoList).toEqual([]);
        expect(result.report.invalidAuthList).toEqual([{ id: "u4", name: "testuser" }]);
    });

    it("Should detects invalid user in both 2FA and WHO as invalidWho and invalidTwoFa and invalidAuth", async () => {
        const user: TwoFactorUser = {
            ...baseUser,
            id: "u5",
            userGroups: [
                { id: TWO_FACTOR_GROUP_ID, name: "" },
                { id: WHO_ACCOUNT_GROUP_ID, name: "" },
            ],
        };
        const useCase = createUseCase({ users: [user], config: defaultConfig });

        const result = await useCase.execute(useCaseOptionsDisabledFalse);

        expect(result.report.invalidTwoFAList).toEqual([{ id: "u5", name: "testuser" }]);
        expect(result.report.invalidWhoList).toEqual([{ id: "u5", name: "testuser" }]);
        expect(result.report.invalidAuthList).toEqual([{ id: "u5", name: "testuser" }]);
    });

    it("Should detects invalid user in WHO as invalidWho and invalidAuth", async () => {
        const user: TwoFactorUser = {
            ...baseUser,
            id: "u5",
            twoFA: true,
            userGroups: [
                { id: TWO_FACTOR_GROUP_ID, name: "" },
                { id: WHO_ACCOUNT_GROUP_ID, name: "" },
            ],
        };
        const useCase = createUseCase({ users: [user], config: defaultConfig });

        const result = await useCase.execute(useCaseOptionsDisabledFalse);

        expect(result.report.invalidTwoFAList).toEqual([]);
        expect(result.report.invalidWhoList).toEqual([{ id: "u5", name: "testuser" }]);
        expect(result.report.invalidAuthList).toEqual([{ id: "u5", name: "testuser" }]);
    });

    it("Should detects invalid user in twoFA but valid who only as invalidAuth", async () => {
        const user: TwoFactorUser = {
            ...baseUser,
            id: "u5",
            externalAuth: true,
            userGroups: [
                { id: TWO_FACTOR_GROUP_ID, name: "" },
                { id: WHO_ACCOUNT_GROUP_ID, name: "" },
            ],
        };
        const useCase = createUseCase({ users: [user], config: defaultConfig });

        const result = await useCase.execute(useCaseOptionsDisabledFalse);

        expect(result.report.invalidTwoFAList).toEqual([]);
        expect(result.report.invalidWhoList).toEqual([]);
        expect(result.report.invalidAuthList).toEqual([{ id: "u5", name: "testuser" }]);
    });

    it("Should push report with 0 affected users and empty affected user list if all the users has two factor activated and one with two factor disabled but externalAccess true", async () => {
        const useCase = createUseCase({
            users: [userWithTwoFA, userWithTwoFA, userInTwoFAGroupButWithExternalAuth],
        });

        const result = await useCase.execute(useCaseOptionsDisabledFalse);

        expect(result.report.invalidTwoFAList).toEqual([]);
        expect(result.message).toEqual("OK");
    });

    it("Should push report 1 affected user if we provide a list with two users, and only one has two-factor authentication disabled.", async () => {
        const useCase = createUseCase({ users: listOfUsersOneValidOneInvalid });

        const result = await useCase.execute(useCaseOptionsDisabledFalse);

        const expectedReport = { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username };
        expect(result.report.invalidTwoFAList).toEqual([expectedReport]);
        expect(result.message).toEqual("OK");
    });

    it("Should push report 2 affected users and a list of 2 affected user if 2 user has two factor deactivate and 1 activated", async () => {
        const useCase = createUseCase({ users: listOfUsersWithTwoInvalid });

        const result = await useCase.execute(useCaseOptionsDisabledFalse);

        const expectedReport = [
            { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username },
            { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username },
        ];
        expect(result.report.invalidTwoFAList).toEqual(expectedReport);
        expect(result.message).toEqual("OK");
    });

    it("Should push report 1 affected users and a list of 1 affected user if 1 user has two factor deactivate and 2 activated", async () => {
        const useCase = createUseCase({ users: listOfUsersWithTwoValid });

        const result = await useCase.execute(useCaseOptionsDisabledFalse);

        const expectedReport = [{ id: userWithoutTwoFA.id, name: userWithoutTwoFA.username }];
        expect(result.report.invalidTwoFAList).toEqual(expectedReport);
        expect(result.message).toEqual("OK");
    });

    it("Should detects 0 users if only exist disabled users", async () => {
        const disabledUser = { ...userWithoutTwoFA, disabled: true };
        const useCase = createUseCase({ users: [userWithTwoFA, disabledUser], config: alternativeConfig });

        const result = await useCase.execute(useCaseOptionsDisabledFalse);

        expect(result.report.invalidTwoFAList).toEqual([]);
    });

    it("Should execute disabled acction in enabled (invalid) users when 'disabledusers' is true", async () => {
        const disabledUser = { ...userWithoutTwoFA, disabled: true };
        const useCase = createUseCase({
            users: [userWithoutTwoFA, disabledUser, userWithoutTwoFAdisabled],
            config: alternativeConfig,
        });

        const result = await useCase.execute(useCaseOptionsDisabledTrue);

        const expectedReport = [{ id: userWithoutTwoFA.id, name: userWithoutTwoFA.username }];
        expect(result.report.invalidTwoFAList).toEqual(expectedReport);
        expect(result.disableUsersMessage).contain("Disabled users action is enabled and executed.");
    });

    it("Should skip disabling users when 'disabledusers' is false, even if there are invalid users", async () => {
        const disabledUser = { ...userWithoutTwoFA, disabled: true };
        const useCase = createUseCase({
            users: [userWithoutTwoFA, disabledUser, userWithoutTwoFAdisabled],
            config: alternativeConfig,
        });

        const result = await useCase.execute(useCaseOptionsDisabledFalse);

        const expectedReport = [{ id: userWithoutTwoFA.id, name: userWithoutTwoFA.username }];
        expect(result.report.invalidTwoFAList).toEqual(expectedReport);
        expect(result.disableUsersMessage).toEqual("Disabled users action is not enabled.");
    });

    it("Should classify users into correct invalid categories (2FA, WHO, AUTH)", async () => {
        const useCase = createUseCase({ users: mixedInvalidUsers, config: alternativeConfig });

        const result = await useCase.execute(useCaseOptionsDisabledFalse);

        expect(result.report.invalidTwoFAList).toEqual([
            { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username },
        ]);
        expect(result.report.invalidWhoList).toEqual([
            { id: userWithoutExternalAuth.id, name: userWithoutExternalAuth.username },
        ]);
        expect(result.report.invalidAuthList).toEqual([
            { id: userInvalidAuth.id, name: userInvalidAuth.username },
        ]);
    });

    it("Should throw error when filteredByMonth is true but disableAfterMonths is not configured", async () => {
        const user: TwoFactorUser = {
            ...baseUser,
            id: "u1",
            userGroups: [{ id: TWO_FACTOR_GROUP_ID, name: "TwoFactorGroup" }],
        };
        const configWithoutMonths: TwoFactorUserOptions = {
            ...defaultConfig,
            disableAfterMonths: undefined,
        };
        const useCase = createUseCase({ users: [user], config: configWithoutMonths });

        await expect(
            useCase.execute({ shouldDisableInvalidUsers: false, filteredByMonth: true })
        ).rejects.toThrow(
            "filteredByMonth is enabled but disableAfterMonths is not configured in the datastore."
        );
    });

    it("Should filter invalid users by creation date when filteredByMonth is true and disableAfterMonths is configured", async () => {
        const now = new Date();
        const oldDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString();
        const recentDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const oldUser: TwoFactorUser = {
            ...baseUser,
            id: "old-user",
            username: "old-user",
            created: oldDate,
            userGroups: [{ id: TWO_FACTOR_GROUP_ID, name: "TwoFactorGroup" }],
        };
        const recentUser: TwoFactorUser = {
            ...baseUser,
            id: "recent-user",
            username: "recent-user",
            created: recentDate,
            userGroups: [{ id: TWO_FACTOR_GROUP_ID, name: "TwoFactorGroup" }],
        };
        const configWithMonths: TwoFactorUserOptions = {
            ...defaultConfig,
            disableAfterMonths: 6,
        };
        const useCase = createUseCase({ users: [oldUser, recentUser], config: configWithMonths });

        const result = await useCase.execute({ shouldDisableInvalidUsers: false, filteredByMonth: true });

        expect(result.report.invalidTwoFAList).toEqual([{ id: "old-user", name: "old-user" }]);
    });

    it("Should not filter by date when filteredByMonth is false even if disableAfterMonths is configured", async () => {
        const now = new Date();
        const recentDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const recentUser: TwoFactorUser = {
            ...baseUser,
            id: "recent-user",
            username: "recent-user",
            created: recentDate,
            userGroups: [{ id: TWO_FACTOR_GROUP_ID, name: "TwoFactorGroup" }],
        };
        const configWithMonths: TwoFactorUserOptions = {
            ...defaultConfig,
            disableAfterMonths: 6,
        };
        const useCase = createUseCase({ users: [recentUser], config: configWithMonths });

        const result = await useCase.execute({ shouldDisableInvalidUsers: false, filteredByMonth: false });

        expect(result.report.invalidTwoFAList).toEqual([{ id: "recent-user", name: "recent-user" }]);
    });

    it("Should disable only filtered users when both disableUsers and filteredByMonth are true", async () => {
        const now = new Date();
        const oldDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString();
        const recentDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const oldUser: TwoFactorUser = {
            ...baseUser,
            id: "old-user",
            username: "old-user",
            created: oldDate,
            userGroups: [{ id: TWO_FACTOR_GROUP_ID, name: "TwoFactorGroup" }],
        };
        const recentUser: TwoFactorUser = {
            ...baseUser,
            id: "recent-user",
            username: "recent-user",
            created: recentDate,
            userGroups: [{ id: TWO_FACTOR_GROUP_ID, name: "TwoFactorGroup" }],
        };
        const configWithMonths: TwoFactorUserOptions = {
            ...defaultConfig,
            disableAfterMonths: 6,
        };
        const useCase = createUseCase({ users: [oldUser, recentUser], config: configWithMonths });

        const result = await useCase.execute({ shouldDisableInvalidUsers: true, filteredByMonth: true });

        expect(result.report.invalidTwoFAList).toEqual([{ id: "old-user", name: "old-user" }]);
        expect(result.disableUsersMessage).contain("Disabled users action is enabled and executed.");
    });

    it("Should disable all invalid users when disableUsers is true and filteredByMonth is false", async () => {
        const now = new Date();
        const recentDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const recentUser: TwoFactorUser = {
            ...baseUser,
            id: "recent-user",
            username: "recent-user",
            created: recentDate,
            userGroups: [{ id: TWO_FACTOR_GROUP_ID, name: "TwoFactorGroup" }],
        };
        const configWithMonths: TwoFactorUserOptions = {
            ...defaultConfig,
            disableAfterMonths: 6,
        };
        const useCase = createUseCase({ users: [recentUser], config: configWithMonths });

        const result = await useCase.execute({ shouldDisableInvalidUsers: true, filteredByMonth: false });

        expect(result.report.invalidTwoFAList).toEqual([{ id: "recent-user", name: "recent-user" }]);
        expect(result.disableUsersMessage).contain("Disabled users action is enabled and executed.");
    });
});

describe("TwoFactorReportUseCase with userDateOverrides", () => {
    const now = new Date();
    const oldDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString();
    const recentDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const configWithMonths: TwoFactorUserOptions = { ...defaultConfig, disableAfterMonths: 6 };

    function makeInvalid2FAUser(id: string, created: string): TwoFactorUser {
        return {
            ...baseUser,
            id,
            username: id,
            created,
            userGroups: [{ id: TWO_FACTOR_GROUP_ID, name: "TwoFactorGroup" }],
        };
    }

    it("Should protect an overridden user with a recent JSON date from being disabled", async () => {
        const oldUser = makeInvalid2FAUser("old-user", oldDate);
        const overrides: UserDateOverride = {
            createdDate: recentDate,
            users: [{ id: "old-user", username: "old-user" }],
        };
        const useCase = createUseCase({ users: [oldUser], config: configWithMonths });

        const result = await useCase.execute({
            shouldDisableInvalidUsers: true,
            filteredByMonth: true,
            userDateOverrides: overrides,
        });

        expect(result.report.invalidTwoFAList).toEqual([]);
        expect(result.disableUsersMessage).contain("no invalid users found");
    });

    it("Should still disable an overridden user whose JSON date is old enough", async () => {
        const recentUser = makeInvalid2FAUser("recent-user", recentDate);
        const overrides: UserDateOverride = {
            createdDate: oldDate,
            users: [{ id: "recent-user", username: "recent-user" }],
        };
        const useCase = createUseCase({ users: [recentUser], config: configWithMonths });

        const result = await useCase.execute({
            shouldDisableInvalidUsers: true,
            filteredByMonth: true,
            userDateOverrides: overrides,
        });

        expect(result.report.invalidTwoFAList).toEqual([{ id: "recent-user", name: "recent-user" }]);
        expect(result.disableUsersMessage).contain("Disabled users action is enabled and executed.");
    });

    it("Should not apply overrides when filteredByMonth is false (real date is used)", async () => {
        const recentUser = makeInvalid2FAUser("recent-user", recentDate);
        const overrides: UserDateOverride = {
            createdDate: oldDate,
            users: [{ id: "recent-user", username: "recent-user" }],
        };
        const useCase = createUseCase({ users: [recentUser], config: configWithMonths });

        const result = await useCase.execute({
            shouldDisableInvalidUsers: false,
            filteredByMonth: false,
            userDateOverrides: overrides,
        });

        expect(result.report.invalidTwoFAList).toEqual([{ id: "recent-user", name: "recent-user" }]);
    });

    it("Should not affect users whose id is not in the overrides list", async () => {
        const oldUser = makeInvalid2FAUser("old-user", oldDate);
        const overrides: UserDateOverride = {
            createdDate: recentDate,
            users: [{ id: "different-user", username: "different-user" }],
        };
        const useCase = createUseCase({ users: [oldUser], config: configWithMonths });

        const result = await useCase.execute({
            shouldDisableInvalidUsers: false,
            filteredByMonth: true,
            userDateOverrides: overrides,
        });

        expect(result.report.invalidTwoFAList).toEqual([{ id: "old-user", name: "old-user" }]);
    });

    it("Should behave identically to no override when userDateOverrides is undefined", async () => {
        const oldUser = makeInvalid2FAUser("old-user", oldDate);
        const useCase = createUseCase({ users: [oldUser], config: configWithMonths });

        const result = await useCase.execute({
            shouldDisableInvalidUsers: false,
            filteredByMonth: true,
            userDateOverrides: undefined,
        });

        expect(result.report.invalidTwoFAList).toEqual([{ id: "old-user", name: "old-user" }]);
    });
});

describe("filterByCreationDate", () => {
    const makeUser = (created: string): TwoFactorUser => ({
        ...baseUser,
        id: "u1",
        userGroups: [{ id: TWO_FACTOR_GROUP_ID, name: "" }],
        created,
    });

    it("Should not filter a user created just 1 day before month boundary (edge case)", () => {
        const now = new Date();
        // User created on the last day of the previous month — less than 1 full month ago
        const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
        const result = filterByCreationDate([makeUser(lastDayPrevMonth)], 1);
        expect(result).toEqual([]);
    });

    it("Should filter a user created exactly 1 month ago", () => {
        const now = new Date();
        // e.g. if now is 2026-03-26, this is 2026-02-26
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
        const result = filterByCreationDate([makeUser(oneMonthAgo)], 1);
        expect(result).toHaveLength(1);
    });

    it("Should filter a user created 7 months ago with disableAfterMonths 6", () => {
        const now = new Date();
        // e.g. if now is 2026-03-26, this is 2025-08-26 (7 months ago)
        const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, now.getDate()).toISOString();
        const result = filterByCreationDate([makeUser(sevenMonthsAgo)], 6);
        expect(result).toHaveLength(1);
    });

    it("Should filter all users when disableAfterMonths is 0", () => {
        const now = new Date();
        // e.g. if now is 2026-03-26, this is 2026-03-01 (first day of current month, 0 months diff)
        const recent = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const result = filterByCreationDate([makeUser(recent)], 0);
        expect(result).toHaveLength(1);
    });
});

describe("applyUserDateOverrides", () => {
    const baseUser2FA: TwoFactorUser = {
        ...baseUser,
        id: "u1",
        userGroups: [{ id: TWO_FACTOR_GROUP_ID, name: "" }],
        created: "2020-01-01T00:00:00.000",
    };

    it("Should return users unchanged when overrides is undefined", () => {
        const result = applyUserDateOverrides([baseUser2FA], undefined);
        expect(result).toEqual([baseUser2FA]);
    });

    it("Should replace created date for a user in the overrides list", () => {
        const overrides: UserDateOverride = {
            createdDate: "2026-06-10",
            users: [{ id: "u1", username: "testuser" }],
        };
        const result = applyUserDateOverrides([baseUser2FA], overrides);
        expect(result[0]?.created).toBe("2026-06-10");
    });

    it("Should not modify a user whose id is not in the overrides list", () => {
        const overrides: UserDateOverride = {
            createdDate: "2026-06-10",
            users: [{ id: "other-id", username: "other" }],
        };
        const result = applyUserDateOverrides([baseUser2FA], overrides);
        expect(result[0]?.created).toBe("2020-01-01T00:00:00.000");
    });

    it("Should handle an empty overrides user list without modifying any user", () => {
        const overrides: UserDateOverride = { createdDate: "2026-06-10", users: [] };
        const result = applyUserDateOverrides([baseUser2FA], overrides);
        expect(result[0]?.created).toBe("2020-01-01T00:00:00.000");
    });

    it("Should apply override only to matching user when multiple users are present", () => {
        const user2: TwoFactorUser = { ...baseUser2FA, id: "u2", created: "2019-01-01T00:00:00.000" };
        const overrides: UserDateOverride = {
            createdDate: "2026-06-10",
            users: [{ id: "u1", username: "testuser" }],
        };
        const result = applyUserDateOverrides([baseUser2FA, user2], overrides);
        expect(result[0]?.created).toBe("2026-06-10");
        expect(result[1]?.created).toBe("2019-01-01T00:00:00.000");
    });
});

function createUseCase({
    users,
    config = alternativeConfig,
}: {
    users: TwoFactorUser[];
    config?: TwoFactorUserOptions;
}): RunTwoFactorReportUseCase {
    const excludedGroupIds = config.exceptionGroup?.map(g => g.id) ?? [];

    const userRepo = mock(TwoFactorUserD2Repository);
    when(userRepo.getUsersNotInGroupIds(deepEqual(excludedGroupIds))).thenResolve(users);
    when(userRepo.disableUsers(anything())).thenResolve([
        {
            userId: "mock-user",
            status: "success",
            response: "Disabled users action is enabled and executed.",
        },
    ]);

    const reportRepo = mock(TwoFactorReportD2Repository);
    when(reportRepo.save(anything(), anything())).thenResolve("OK");

    const configRepo = mock(TwoFactorConfigD2Repository);
    when(configRepo.get()).thenResolve(config);

    const programRepo = mock(UserMonitoringProgramD2Repository);

    return new RunTwoFactorReportUseCase(
        instance(userRepo),
        instance(reportRepo),
        instance(configRepo),
        instance(programRepo)
    );
}
