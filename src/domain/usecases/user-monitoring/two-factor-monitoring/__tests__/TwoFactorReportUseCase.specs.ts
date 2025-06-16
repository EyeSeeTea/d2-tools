import { describe, it, expect } from "vitest";

import { RunTwoFactorReportUseCase } from "../RunTwoFactorReportUseCase";
import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { anything, deepEqual, instance, mock, when } from "ts-mockito";
import {
    config_exception_and_disabled,
    default_config,
    listOfUsers,
    listOfUsersWithTwoInvalid,
    listOfUsersWithTwoValid,
    mixedInvalidUsers,
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
import { NonUsersException } from "domain/entities/user-monitoring/two-factor-monitoring/exception/NonUsersException";
import { TwoFactorUserOptions } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserOptions";

describe("TwoFactorReportUseCase", () => {
    it("Should push report with 0 affected users and empty affected user list if one user has two factor activated", async () => {
        const useCase = givenUsers([userWithTwoFA]);

        const result = await useCase.execute(false);

        expect(result.report.invalidTwoFACount).toEqual(0);
        expect(result.report.invalidTwoFAList).toEqual([]);
        expect(result.message).toEqual("OK");
    });

    it("Should push report with 0 affected users and empty affected user list if all the users has two factor activated", async () => {
        const useCase = givenUsers([userWithTwoFA, userWithTwoFA]);

        const result = await useCase.execute(false);

        expect(result.report.invalidTwoFACount).toEqual(0);
        expect(result.report.invalidTwoFAList).toEqual([]);
        expect(result.message).toEqual("OK");
    });

    it("Should push report with 0 affected users and empty affected user list if all the users has no two factor activated", async () => {
        const useCase = givenUsers([userWithTwoFA, userWithTwoFA]);

        const result = await useCase.execute(false);

        expect(result.report.invalidTwoFACount).toEqual(0);
        expect(result.report.invalidTwoFAList).toEqual([]);
        expect(result.message).toEqual("OK");
    });
    
    
    it("Should push report with 1 affected users and 1 affected user list if 1 user has two factor deactivated", async () => {
        const useCase = givenUsers([userWithoutTwoFA]);

        const result = await useCase.execute(false);

        const expectedReport = { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username };
        expect(result.report.invalidTwoFACount).toEqual(1);
        expect(result.report.invalidTwoFAList).toEqual([expectedReport]);
        expect(result.message).toEqual("OK");
    });
    
    it("Should push report 1 affected user if we provide a list with two users, and only one has two-factor authentication disabled.", async () => {
        const useCase = givenUsers(listOfUsers);

        const result = await useCase.execute(false);

        const expectedReport = { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username };
        expect(result.report.invalidTwoFACount).toEqual(1);
        expect(result.report.invalidTwoFAList).toEqual([expectedReport]);
        expect(result.message).toEqual("OK");
    });
    
    it("Should push report 2 affected users and a list of 2 affected user if 2 user has two factor deactivate and 1 activated", async () => {
        const useCase = givenUsers(listOfUsersWithTwoInvalid);

        const result = await useCase.execute(false);

        const expectedReport = [
            { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username },
            { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username },
        ];
        expect(result.report.invalidTwoFACount).toEqual(2);
        expect(result.report.invalidTwoFAList).toEqual(expectedReport);
        expect(result.message).toEqual("OK");
    });
    
    it("Should push report 1 affected users and a list of 1 affected user if 1 user has two factor deactivate and 2 activated", async () => {
        const useCase = givenUsers(listOfUsersWithTwoValid);

        const result = await useCase.execute(false);

        const expectedReport = [{ id: userWithoutTwoFA.id, name: userWithoutTwoFA.username }];
        expect(result.report.invalidTwoFACount).toEqual(1);
        expect(result.report.invalidTwoFAList).toEqual(expectedReport);
        expect(result.message).toEqual("OK");
    });

    it("Should report 0 users if reported users was in exception usergroup", async () => {
    const disabledUser = { ...userWithoutTwoFA, disabled: true };
    const useCase = givenUsersWithConfig([userWithoutTwoFA, disabledUser, userWithoutTwoFAdisabled], config_exception_and_disabled);

    const result = await useCase.execute(true);

    expect(result.report.invalidTwoFACount).toEqual(0);
    expect(result.report.invalidTwoFAList).toEqual([]);
    expect(result.disableUsersMessage).contain("No users found.");
    expect(result.message).toBe("OK");
}); 
    it("Should ignore disabled users if only exist disabled users", async () => {
    const disabledUser = { ...userWithoutTwoFA, disabled: true };
    const useCase = givenUsersWithConfig([userWithTwoFA, disabledUser], default_config);

    const result = await useCase.execute(true);

    expect(result.report.invalidTwoFACount).toEqual(0);
    expect(result.report.invalidTwoFAList).toEqual([]);
}); 

    it("Should report 1 user if two exist without twoFA but only 1 is enabled", async () => {
    const disabledUser = { ...userWithoutTwoFA, disabled: true };
    const useCase = givenUsersWithConfig([userWithoutTwoFA, disabledUser, userWithoutTwoFAdisabled], default_config);

    const result = await useCase.execute(true);

    const expectedReport = [{ id: userWithoutTwoFA.id, name: userWithoutTwoFA.username }];
    expect(result.report.invalidTwoFACount).toEqual(1);
    expect(result.report.invalidTwoFAList).toEqual(expectedReport);
    expect(result.disableUsersMessage).contain("Disabled users action is enabled and executed.");
});

    it("Should report Disabled users action is not enabled. If disabledInvalid is false", async () => {
    const disabledUser = { ...userWithoutTwoFA, disabled: true };
    const useCase = givenUsersWithConfig([userWithoutTwoFA, disabledUser, userWithoutTwoFAdisabled], default_config);

    const result = await useCase.execute(false);

    const expectedReport = [{ id: userWithoutTwoFA.id, name: userWithoutTwoFA.username }];
    expect(result.report.invalidTwoFACount).toEqual(1);
    expect(result.report.invalidTwoFAList).toEqual(expectedReport);
    expect(result.disableUsersMessage).toEqual("Disabled users action is not enabled.");
}); 

    it("Should report Disabled users action is not executed due to no invalid users found. If disabledInvalid is true but all users are disabled", async () => {
    const disabledUser = { ...userWithoutTwoFA, disabled: true };
    const useCase = givenUsersWithConfig([disabledUser, userWithoutTwoFAdisabled], default_config);

    const result = await useCase.execute(true);

    expect(result.report.invalidTwoFACount).toEqual(0); 
    expect(result.disableUsersMessage).toContain("Disabled users action is not executed due to no invalid users found.");
}); 

it("Should not fail if whoAccountGroup is undefined", async () => {
    const configWithoutWHO = { ...default_config, whoAccountGroup: undefined };
    const useCase = givenUsersWithConfig([userWithoutTwoFA], configWithoutWHO);

    const result = await useCase.execute(false);

    expect(result.report.invalidWhoCount).toBe(0);
    expect(result.report.invalidWhoList).toEqual([]);
});

it("Should report WHO-invalid users correctly", async () => {
    const useCase = givenUsersWithConfig([userWithoutExternalAuth], default_config);

    const result = await useCase.execute(false);

    expect(result.report.invalidWhoCount).toBe(1);
    expect(result.report.invalidWhoList).toEqual([
        { id: userWithoutExternalAuth.id, name: userWithoutExternalAuth.username }
    ]);
});

it("Should report auth-invalid users correctly (not in 2FA or WHO)", async () => {
    const useCase = givenUsersWithConfig([userInvalidAuth], default_config);

    const result = await useCase.execute(false);

    expect(result.report.invalidAuthCount).toBe(1);
    expect(result.report.invalidAuthList).toEqual([
        { id: userInvalidAuth.id, name: userInvalidAuth.username }
    ]);
});

it("Should classify users into correct invalid categories (2FA, WHO, AUTH)", async () => {
    const useCase = givenUsersWithConfig(mixedInvalidUsers, default_config);

    const result = await useCase.execute(false);

    expect(result.report.invalidTwoFACount).toBe(1);
    expect(result.report.invalidWhoCount).toBe(1);
    expect(result.report.invalidAuthCount).toBe(1);

    expect(result.report.invalidTwoFAList).toEqual([
        { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username }
    ]);
    expect(result.report.invalidWhoList).toEqual([
        { id: userWithoutExternalAuth.id, name: userWithoutExternalAuth.username }
    ]);
    expect(result.report.invalidAuthList).toEqual([
        { id: userInvalidAuth.id, name: userInvalidAuth.username }
    ]);
});


});

function givenUsersWithConfig(users: TwoFactorUser[], config = default_config) {
    const useCase = new RunTwoFactorReportUseCase(
        givenUserRepository(users),
        givenTwoFactorReportD2Repository(),
        givenConfigRepository(config),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}


function givenUsers(users: TwoFactorUser[]) {
    const useCase = new RunTwoFactorReportUseCase(
        givenUserRepository(users),
        givenTwoFactorReportD2Repository(),
        givenConfigRepository(),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}

function givenInvalidUserGroupId() {
    const useCase = new RunTwoFactorReportUseCase(
        givenUserRepository([], ["invalidGroupId"]),
        givenTwoFactorReportD2Repository(),
        givenConfigRepository(),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}

function givenUserRepository(users: TwoFactorUser[], excludedGroupIds =  default_config.exceptionGroup?.map(group => group.id) ?? []) {
    const mockedRepository = mock(TwoFactorUserD2Repository);
    when(mockedRepository.getUsersNotInGroupIds(deepEqual(excludedGroupIds))).thenReturn(Promise.resolve(users));
    when(mockedRepository.disableUsers(anything())).thenReturn(Promise.resolve("Disabled users action is enabled and executed."));
    const configRepository = instance(mockedRepository);
    return configRepository;
}
function givenTwoFactorReportD2Repository() {
    const mockedRepository = mock(TwoFactorReportD2Repository);
    when(mockedRepository.save(anything(), anything())).thenReturn(Promise.resolve("OK"));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}
function givenUserMonitoringProgramD2Repository() {
    const mockedRepository = mock(UserMonitoringProgramD2Repository);
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenConfigRepository(config: TwoFactorUserOptions = default_config) {
    const mockedRepository = mock(TwoFactorConfigD2Repository);
    when(mockedRepository.get()).thenReturn(Promise.resolve(config));
    const configRepository = instance(mockedRepository);
    return configRepository;
}
