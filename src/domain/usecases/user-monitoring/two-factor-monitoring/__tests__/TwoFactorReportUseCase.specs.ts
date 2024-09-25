import { describe, it, expect } from "vitest";

import { RunTwoFactorReportUseCase } from "../RunTwoFactorReportUseCase";
import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { anything, deepEqual, instance, mock, when } from "ts-mockito";
import {
    config,
    listOfUsers,
    listOfUsersWithTwoInvalid,
    listOfUsersWithTwoValid,
    programMetadata,
    userWithoutTwoFA,
    userWithTwoFA,
} from "./TwoFactorTest.data";
import { TwoFactorUserD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUserD2Repository";
import { TwoFactorReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorReportD2Repository";
import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";

describe("TwoFactorReportUseCase", () => {
    it("Should push report with 0 affected users and empty affected user list if all the users has two factor activated", async () => {
        const useCase = givenUsers([userWithTwoFA]);

        const result = await useCase.execute();

        expect(result.report.invalidUsersCount).toEqual(0);
        expect(result.report.listOfAffectedUsers).toEqual([]);
        expect(result.message).toEqual("OK");
    });
});

describe("TwoFactorReportUseCase", () => {
    it("Should push report with 1 affected users and 1 affected user list if 1 the users has two factor deactivated", async () => {
        const useCase = givenUsers([userWithoutTwoFA]);

        const result = await useCase.execute();

        const expectedReport = { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username };
        expect(result.report.invalidUsersCount).toEqual(1);
        expect(result.report.listOfAffectedUsers).toEqual([expectedReport]);
        expect(result.message).toEqual("OK");
    });
});

describe("TwoFactorReportUseCase", () => {
    it("Should push report with 1 affected users and 1 affected user list if one user has two factor activated and other deactivated", async () => {
        const useCase = givenUsers(listOfUsers);

        const result = await useCase.execute();

        const expectedReport = { id: userWithoutTwoFA.id, name: userWithoutTwoFA.username };
        expect(result.report.invalidUsersCount).toEqual(1);
        expect(result.report.listOfAffectedUsers).toEqual([expectedReport]);
        expect(result.message).toEqual("OK");
    });
});

describe("TwoFactorReportUseCase", () => {
    it("Should push report with 1 affected users and 1 affected user list if 2 user has two factor deactivate and 1 activated", async () => {
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
});

describe("TwoFactorReportUseCase", () => {
    it("Should push report with 1 affected users and 1 affected user list if 1 user has two factor deactivate and 2 activated", async () => {
        const useCase = givenUsers(listOfUsersWithTwoValid);

        const result = await useCase.execute();

        const expectedReport = [{ id: userWithoutTwoFA.id, name: userWithoutTwoFA.username }];
        expect(result.report.invalidUsersCount).toEqual(1);
        expect(result.report.listOfAffectedUsers).toEqual(expectedReport);
        expect(result.message).toEqual("OK");
    });
});
function givenUsers(users: TwoFactorUser[]) {
    const useCase = new RunTwoFactorReportUseCase(
        givenUserRepository(users),
        givenTwoFactorReportD2Repository(),
        givenConfigRepository(),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}

function givenUserRepository(users: TwoFactorUser[]) {
    const mockedRepository = mock(TwoFactorUserD2Repository);
    when(mockedRepository.getUsersByGroupId(deepEqual([config.twoFactorGroup.id]))).thenReturn(
        Promise.resolve(users)
    );
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
    when(mockedRepository.get(deepEqual(config.pushProgram.id))).thenReturn(Promise.resolve(programMetadata));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenConfigRepository() {
    const mockedRepository = mock(TwoFactorConfigD2Repository);
    when(mockedRepository.get()).thenReturn(Promise.resolve(config));
    const configRepository = instance(mockedRepository);
    return configRepository;
}
