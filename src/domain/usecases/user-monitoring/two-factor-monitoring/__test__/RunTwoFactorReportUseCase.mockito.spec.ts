import { anything, deepEqual, instance, mock, verify, when } from "ts-mockito";
import { describe, it, expect } from "vitest";
import { RunTwoFactorReportUseCase } from "domain/usecases/user-monitoring/two-factor-monitoring/RunTwoFactorReportUseCase";
import { TwoFactorReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorReportD2Repository";
import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { TwoFactorUserOptions } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserOptions";
import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";
import { TwoFactorUserD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUserD2Repository";
import { UserMonitoringProgramMetadata } from "domain/entities/user-monitoring/common/UserMonitoringProgramMetadata";
import { TwoFactorUserReport } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserReport";
import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import { NonUsersException } from "domain/entities/user-monitoring/two-factor-monitoring/exception/NonUsersException";

const twoFactorUserOptions: TwoFactorUserOptions = {
    pushProgramId: { id: "fakeprogramid", name: "fakeprogramname" },
    twoFactorGroup: { id: "faketwofactorid", name: "faketwofactoriname" },
};

// This would go to a separate file
const fakeUsers: TwoFactorUser[] = [
    {
        id: "fakeuserid",
        username: "fakeusername",
        twoFA: false,
    },
    {
        id: "fakevaliduserid",
        username: "fakevalidusername",
        twoFA: true,
    },
];
const fakeProgram = {
    id: "fakeprogramid",
    orgUnitId: "fakeorgunitid",
    programStageId: "fakeprogramstage",
    dataElements: [
        {
            id: "fakecountdataelementid",
            code: "ADMIN_users_without_two_factor_count_7_Events",
            name: "fakecountdataelementname",
        },
        {
            id: "fakeusersdataelementid",
            code: "ADMIN_users_without_two_factor_8_Events",
            name: "fakeusersdataelementname",
        },
    ],
};

const fakeUserReport = {
    invalidUsersCount: 1,
    listOfAffectedUsers: [{ id: "fakeuserid", name: "fakeusername" }],
};

const twoFactorGroupId = [twoFactorUserOptions.twoFactorGroup.id];
const programGroupId = twoFactorUserOptions.pushProgramId.id;

async function givenAStubTwoFactorUserD2Repository(users: TwoFactorUser[]) {
    const mockedRepository = mock(TwoFactorUserD2Repository);

    // anything() can be used to invoke the method with any argument to check the return value
    when(mockedRepository.getUsersByGroupId(deepEqual(twoFactorGroupId))).thenReturn(Promise.resolve(users));

    const userRepository = instance(mockedRepository);

    return userRepository;
}

function givenAStubConfigD2Repository() {
    const mockedRepository = mock(TwoFactorConfigD2Repository);

    // anything() can be used to invoke the method with any argument to check the return value
    when(mockedRepository.get()).thenResolve(twoFactorUserOptions);

    const configRepository = instance(mockedRepository);

    return configRepository;
}

async function givenAStubReportD2Repository(a: UserMonitoringProgramMetadata, b: TwoFactorUserReport) {
    const mockedRepository = mock(TwoFactorReportD2Repository);

    when(mockedRepository.save(deepEqual(a), deepEqual(fakeUserReport))).thenResolve("OK");

    const reportRepository = instance(mockedRepository);

    return await reportRepository;
}

function givenAStubProgramD2Repository() {
    const mockedRepository = mock(UserMonitoringProgramD2Repository);

    // anything() can be used to invoke the method with any argument to check the return value
    when(mockedRepository.get(deepEqual(programGroupId))).thenResolve(fakeProgram);

    const programRepository = instance(mockedRepository);

    return programRepository;
}
describe("Two Factor Monitoring0", () => {
    it("should save only users when exist some users without two-factor 0", async () => {
        const userRepository = await givenAStubTwoFactorUserD2Repository(fakeUsers);
        const configRepository = await givenAStubConfigD2Repository();
        const programRepository = await givenAStubProgramD2Repository();
        const programResult = await programRepository.get(programGroupId);
        const reportRepository = await givenAStubReportD2Repository(
            deepEqual(programResult),
            deepEqual(fakeUserReport)
        );

        const twoFactorReportUseCase = new RunTwoFactorReportUseCase(
            userRepository,
            reportRepository,
            configRepository,
            programRepository
        );
        const result = await twoFactorReportUseCase.execute();
        expect(result).toEqual("OK");
    });
    it("if no users without twofactor should throw exception", async () => {
        const userRepository = await givenAStubTwoFactorUserD2Repository([]);
        const configRepository = await givenAStubConfigD2Repository();
        const programRepository = await givenAStubProgramD2Repository();
        const programResult = await programRepository.get(programGroupId);
        const reportRepository = await givenAStubReportD2Repository(
            deepEqual(programResult),
            deepEqual(fakeUserReport)
        );

        const twoFactorReportUseCase = new RunTwoFactorReportUseCase(
            userRepository,
            reportRepository,
            configRepository,
            programRepository
        );
        expect(twoFactorReportUseCase.execute()).rejects.toThrow(NonUsersException);
    });
});

describe("Test mocked repository", () => {
    it("should return a list of users if exist in twofactor group", async () => {
        const userRepository = await givenAStubTwoFactorUserD2Repository(fakeUsers);

        const result = await userRepository.getUsersByGroupId(twoFactorGroupId);

        expect(result).toEqual(fakeUsers);
    });
});

describe("Test mocked repository2", () => {
    it("should return a two factor config", async () => {
        const configRepository = await givenAStubConfigD2Repository();
        const result = await configRepository.get();

        expect(result).toEqual(twoFactorUserOptions);
    });
});
