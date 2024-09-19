import { describe, it, expect } from "vitest";

import { RunTwoFactorReportUseCase } from "../RunTwoFactorReportUseCase";
import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { instance, mock, when } from "ts-mockito";
import { config, oneInvalidUserTwoFactorReport, programMetadata, userWithTwoFA } from "./TwoFactorTest.data";
import { TwoFactorUserD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUserD2Repository";
import { TwoFactorReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorReportD2Repository";
import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";

function givenAStubUserRepository() {
    const mockedRepository = mock(TwoFactorUserD2Repository);
    when(mockedRepository.getUsersByGroupId([config.twoFactorGroup.id])).thenReturn(
        Promise.resolve([userWithTwoFA])
    );
    const configRepository = instance(mockedRepository);
    return configRepository;
}
function givenAStubTwoFactorReportD2Repository() {
    const mockedRepository = mock(TwoFactorReportD2Repository);
    when(mockedRepository.save(programMetadata, oneInvalidUserTwoFactorReport)).thenReturn(
        Promise.resolve("OK")
    );
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}
function givenAStubUserMonitoringProgramD2Repository() {
    const mockedRepository = mock(UserMonitoringProgramD2Repository);
    when(mockedRepository.get(config.pushProgram.id)).thenReturn(Promise.resolve(programMetadata));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenAStubConfigRepository() {
    const mockedRepository = mock(TwoFactorConfigD2Repository);
    when(mockedRepository.get()).thenReturn(Promise.resolve(config));
    const configRepository = instance(mockedRepository);
    return configRepository;
}

describe("TwoFactorReportUseCase", () => {
    it("Should find users with no factor activated", async () => {
        const useCase = new RunTwoFactorReportUseCase(
            givenAStubUserRepository(),
            givenAStubTwoFactorReportD2Repository(),
            givenAStubConfigRepository(),
            givenAStubUserMonitoringProgramD2Repository()
        );

        const result = await useCase.execute();

        expect(result).toEqual("OK");
    });
});
