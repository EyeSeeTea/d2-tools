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
import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";
import { TwoFactorUserOptions } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserOptions";
const TWO_FACTOR_GROUP_ID = "2FA";
const WHO_ACCOUNT_GROUP_ID = "WHO";
const EXCEPTION_GROUP_ID = "EXC";

const baseUser = {
    externalAuth: false,
    disabled: false,
    twoFA: false,
    username: "testuser",
};

const defaultConfig: TwoFactorUserOptions = {
    pushProgram: { id: "program", name: "Program" },
    twoFactorGroup: { id: TWO_FACTOR_GROUP_ID, name: "2FA Group" },
    whoAccountGroup: { id: WHO_ACCOUNT_GROUP_ID, name: "WHO Group" },
    exceptionGroup: [{ id: EXCEPTION_GROUP_ID, name: "Exception Group" }],
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
};

const useCaseOptionsDisabledFalse = { shouldDisableInvalidUsers: false };
const useCaseOptionsDisabledTrue = { shouldDisableInvalidUsers: true };

describe("TwoFactorReportUseCase", () => {
    it("Should detects a user in 2FA group with twoFA disabled as invalidTwoFA", async () => {
        const user: TwoFactorUser = {
            ...baseUser,
            id: "u1",
            userGroups: [{ id: TWO_FACTOR_GROUP_ID, name: "TwoFactorGroup" }],
        };

        const useCase = createUseCase({ users: [user], config: defaultConfig });

        const result = await useCase.execute({ shouldDisableInvalidUsers: false });

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

        const result = await useCase.execute({ shouldDisableInvalidUsers: false });

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
});

function createUseCase({
    users,
    config = alternativeConfig,
}: {
    users: TwoFactorUser[];
    config?: TwoFactorUserOptions;
    programId?: string;
    programName?: string;
}): RunTwoFactorReportUseCase {
    const excludedGroupIds = config.exceptionGroup?.map(g => g.id) ?? [];

    const userRepo = mock(TwoFactorUserD2Repository);
    when(userRepo.getUsersNotInGroupIds(deepEqual(excludedGroupIds))).thenResolve(users);
    when(userRepo.disableUsers(anything())).thenResolve("Disabled users action is enabled and executed.");

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
