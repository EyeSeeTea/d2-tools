import { describe, it, expect } from "vitest";

import { RunTwoFactorReportUseCase } from "../RunTwoFactorReportUseCase";
import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { anything, deepEqual, instance, mock, when } from "ts-mockito";
import {
    config,
    NoUsersReport,
    oneInvalidUserTwoFactorReport,
    programMetadata,
    userWithTwoFA,
} from "./TwoFactorTest.data";
import { TwoFactorUserD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUserD2Repository";
import { TwoFactorReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorReportD2Repository";
import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";

describe("TwoFactorReportUseCase", () => {
    it("Should push report with 0 affected users and empty affected user list if all the users has two factor activated", async () => {
        const useCase = givenUsersWithoutTwoFactor();

        const result = await useCase.execute();

        expect(result.report.invalidUsersCount).toEqual(0);
        expect(result.report.listOfAffectedUsers).toEqual([]);
        expect(result.message).toEqual("OK");
    });
});

function givenUsersWithoutTwoFactor() {
    const useCase = new RunTwoFactorReportUseCase(
        givenUserRepository(),
        givenTwoFactorReportD2Repository(),
        givenConfigRepository(),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}

function givenUserRepository() {
    const mockedRepository = mock(TwoFactorUserD2Repository);
    when(mockedRepository.getUsersByGroupId(deepEqual([config.twoFactorGroup.id]))).thenReturn(
        Promise.resolve([userWithTwoFA])
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
