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
import { Async } from "domain/entities/Async";

// export const resolvableInstance = <T extends {}>(mock: T) =>
//     new Proxy<T>(instance(mock), {
//         get(target, name: PropertyKey) {
//             if (["Symbol(Symbol.toPrimitive)", "then", "catch"].includes(name.toString())) {
//                 return undefined;
//             }

//             return (target as any)[name];
//         },
//     });

let userRepository: TwoFactorUserD2Repository;
let reportRepository: TwoFactorReportD2Repository;
let configRepository: TwoFactorConfigD2Repository;
let pogramRepository: UserMonitoringProgramD2Repository;
const twoFactorUserOptions: TwoFactorUserOptions = {
    pushProgramId: { id: "fakeprogramid", name: "fakeprogramname" },
    twoFactorGroup: { id: "faketwofactorid", name: "faketwofactoriname" },
};

const users: TwoFactorUser[] = [
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

const asyncUsers: Promise<TwoFactorUser[]> = Promise.resolve([
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
]);
function getFakeProgramMetadata(): UserMonitoringProgramMetadata {
    return {
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
}

function getFakeUserReport(): TwoFactorUserReport {
    return {
        invalidUsersCount: 1,
        listOfAffectedUsers: [{ id: "fakeuserid", name: "fakeusername" }],
    };
}
// Función que configura los mocks
/* function setupMocks() {
    const mockedUserRepository = mock(TwoFactorUserD2Repository);
    const mockedReportRepository = mock(TwoFactorReportD2Repository);
    const mockedConfigRepository = mock(TwoFactorConfigD2Repository);
    const mockedProgramRepository = mock(UserMonitoringProgramD2Repository);

    when(mockedConfigRepository.get()).thenReturn(Promise.resolve(twoFactorUserOptions));
    when(mockedUserRepository.getUsersByGroupId([twoFactorUserOptions.twoFactorGroup.id])).thenReturn(
        Promise.resolve(asyncUsers)
    );
    when(mockedProgramRepository.get(twoFactorUserOptions.pushProgramId.id)).thenResolve(
        Promise.resolve(getFakeProgramMetadata())
    );
    when(mockedReportRepository.save(getFakeProgramMetadata(), getFakeUserReport())).thenResolve("OK");
} */

/* describe("Two Factor Monitoring", () => {
    it("should save only users with two-factor false", async () => {
        mockedUserRepository = mock(TwoFactorUserD2Repository);
        mockedReportRepository = mock(TwoFactorReportD2Repository);
        mockedConfigRepository = mock(TwoFactorConfigD2Repository);
        mockedProgramRepository = mock(UserMonitoringProgramD2Repository);
        when(mockedConfigRepository.get()).thenReturn(Promise.resolve(twoFactorUserOptions));
        when(mockedUserRepository.getUsersByGroupId(["faketwofactorid"])).thenReturn(asyncUsers);
        when(mockedProgramRepository.get(twoFactorUserOptions.pushProgramId.id)).thenResolve(
            Promise.resolve(getFakeProgramMetadata())
        );
        when(mockedReportRepository.save(getFakeProgramMetadata(), getFakeUserReport())).thenResolve("OK");
        const twoFactorReportUseCase = new RunTwoFactorReportUseCase(
            instance(mockedUserRepository),
            instance(mockedReportRepository),
            instance(mockedConfigRepository),
            instance(mockedProgramRepository)
        )
            .execute()
            .then(response => {
                return response;
            });

        expect(twoFactorReportUseCase).toEqual("OK");
        verify(mockedReportRepository.save(getFakeProgramMetadata(), getFakeUserReport())).called();
    });
});

describe("Two Factor Monitoring", () => {
    it("should throw exception if no have users with two-factor false", async () => {
        setupMocks();
        const twoFactorReportUseCase = await new RunTwoFactorReportUseCase(
            instance(mockedUserRepository),
            instance(mockedReportRepository),
            instance(mockedConfigRepository),
            instance(mockedProgramRepository)
        ).execute();

        expect(twoFactorReportUseCase).toEqual("OK");
        verify(mockedReportRepository.save(getFakeProgramMetadata(), getFakeUserReport())).called();
    });
}); */

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

const testParameter = [twoFactorUserOptions.twoFactorGroup.id];

function givenAStubTwoFactorUserD2Repository() {
    const mockedRepository = mock(TwoFactorUserD2Repository);

    // anything() can be used to invoke the method with any argument to check the return value
    when(mockedRepository.getUsersByGroupId(testParameter)).thenResolve(Promise.resolve(fakeUsers));

    const userRepository = instance(mockedRepository);

    return userRepository;
}

describe("Test mocked repository", () => {
    it("only trying to make work the test", async () => {
        const userRepository = givenAStubTwoFactorUserD2Repository();

        const result = await userRepository.getUsersByGroupId(testParameter);

        expect(result).toBe(fakeUsers);
    });
});
/* 
describe("Test mocked repository", () => {
    it("should fetch users correctly", async () => {
        setupMocks(); // Asegúrate de que esta función configura todo correctamente
        const userRepository = instance(mockedUserRepository);

        const result = await userRepository.getUsersByGroupId(["someGroupId"]);

        console.log("resultado" + result);
        expect(result).toEqual([
            { id: "fakeuserid", username: "fakeusername", twoFA: false },
            { id: "fakevaliduserid", username: "fakevalidusername", twoFA: true },
        ]);
    });
    it("should return the correct users", async () => {
        // Configurar el mock para que devuelva los usuarios esperados
        when(mockedUserRepository.getUsersByGroupId([twoFactorUserOptions.twoFactorGroup.id])).thenResolve(
            users
        );

        // Obtener la instancia real del mock
        const userRepositoryInstance = instance(mockedUserRepository);

        // Realizar la llamada y verificar el resultado
        const result = await userRepositoryInstance.getUsersByGroupId([
            twoFactorUserOptions.twoFactorGroup.id,
        ]);
        console.log("resultado" + result);
        expect(result).toEqual(Promise.resolve(users)); // Comparar el resultado devuelto con el array `users`
    });
});
 */
