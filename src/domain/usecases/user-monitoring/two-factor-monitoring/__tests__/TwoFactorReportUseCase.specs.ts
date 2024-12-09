import { describe, it, expect } from "vitest";

import { RunTwoFactorReportUseCase } from "../RunTwoFactorReportUseCase";
import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { anything, deepEqual, instance, mock, when } from "ts-mockito";
import {
    config,
    listOfUsers,
    listOfUsersWithTwoInvalid,
    listOfUsersWithTwoValid,
    userWithoutTwoFA,
    userWithTwoFA,
} from "./TwoFactorTest.data";
import { TwoFactorUserD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUserD2Repository";
import { TwoFactorReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorReportD2Repository";
import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";
import { NonUsersException } from "domain/entities/user-monitoring/two-factor-monitoring/exception/NonUsersException";

describe("TwoFactorReportUseCase", () => {
    it("Should push report with 0 affected users and empty affected user list if one user has two factor activated", async () => {
        const useCase = givenUsers([userWithTwoFA]);

        const result = await useCase.execute();

        expect(result.report.invalidUsersCount).toEqual(0);
        expect(result.report.listOfAffectedUsers).toEqual([]);
        expect(result.message).toEqual("OK");
    });

    it("Should push report with 0 affected users and empty affected user list if all the users has two factor activated", async () => {
        const useCase = givenUsers([userWithTwoFA, userWithTwoFA]);

        const result = await useCase.execute();

        expect(result.report.invalidUsersCount).toEqual(0);
        expect(result.report.listOfAffectedUsers).toEqual([]);
        expect(result.message).toEqual("OK");
    });
    
    it("Should push report with 1 affected users and 1 affected user list if 1 user has two factor deactivated", async () => {
        const useCase = givenUsers([userWithoutTwoFA]);

        const result = await useCase.execute();

        const expectedReport = { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username };
        expect(result.report.invalidUsersCount).toEqual(1);
        expect(result.report.listOfAffectedUsers).toEqual([expectedReport]);
        expect(result.message).toEqual("OK");
    });
    
    it("Should push report 1 affected user if we provide a list with two users, and only one has two-factor authentication disabled.", async () => {
        const useCase = givenUsers(listOfUsers);

        const result = await useCase.execute();

        const expectedReport = { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username };
        expect(result.report.invalidUsersCount).toEqual(1);
        expect(result.report.listOfAffectedUsers).toEqual([expectedReport]);
        expect(result.message).toEqual("OK");
    });
    
    it("Should push report 2 affected users and a list of 2 affected user if 2 user has two factor deactivate and 1 activated", async () => {
        const useCase = givenUsers(listOfUsersWithTwoInvalid);

        const result = await useCase.execute();

        const expectedReport = [
            { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username },
            { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username },
        ];
        expect(result.report.invalidUsersCount).toEqual(2);
        expect(result.report.listOfAffectedUsers).toEqual(expectedReport);
        expect(result.message).toEqual("OK");
    });
    
    it("Should push report 1 affected users and a list of 1 affected user if 1 user has two factor deactivate and 2 activated", async () => {
        const useCase = givenUsers(listOfUsersWithTwoValid);

        const result = await useCase.execute();

        const expectedReport = [{ id: userWithoutTwoFA.id, name: userWithoutTwoFA.username }];
        expect(result.report.invalidUsersCount).toEqual(1);
        expect(result.report.listOfAffectedUsers).toEqual(expectedReport);
        expect(result.message).toEqual("OK");
    });
    
    it("Should throw exception if no users in the given usergroup", async () => {
        const useCase = givenInvalidUserGroupId();
        
        await expect(async () => {
            await useCase.execute();
        }).rejects.toThrow(NonUsersException);
    });
});

function givenUsers(users: TwoFactorUser[]) {
    const useCase = new RunTwoFactorReportUseCase(
        givenUserRepository(users, config.twoFactorGroup.id),
        givenTwoFactorReportD2Repository(),
        givenConfigRepository(),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}
function givenInvalidUserGroupId() {
    const useCase = new RunTwoFactorReportUseCase(
        givenUserRepository([], "invalidGroupId"),
        givenTwoFactorReportD2Repository(),
        givenConfigRepository(),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}

function givenUserRepository(users: TwoFactorUser[], groupId = config.twoFactorGroup.id) {
    const mockedRepository = mock(TwoFactorUserD2Repository);
    when(mockedRepository.getUsersByGroupId(deepEqual([groupId]))).thenReturn(Promise.resolve(users));
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

function givenConfigRepository() {
    const mockedRepository = mock(TwoFactorConfigD2Repository);
    when(mockedRepository.get()).thenReturn(Promise.resolve(config));
    const configRepository = instance(mockedRepository);
    return configRepository;
}
