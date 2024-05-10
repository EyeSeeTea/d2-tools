/* import { instance, mock, when } from "ts-mockito";
import { UserMonitoringUserD2Repository } from "data/user-monitoring/common/UserMonitoringUserD2Repository";
import { RunTwoFactorReportUseCase } from "domain/usecases/user-monitoring/two-factor-monitoring/RunTwoFactorReportUseCase";
import { TwoFactorUsersReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUsersReportD2Repository";
import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import { TwoFactorUserOptions } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserOptions";
import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";
import { TwoFactorUserD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUserD2Repository";
import { UserMonitoringProgramMetadata } from "domain/entities/user-monitoring/common/UserMonitoringProgramMetadata";

getTwoFactorUsers(){
    const mockedUserRepository = mock(TwoFactorUserD2Repository);
    const mockedReportRepository = mock(TwoFactorUsersReportD2Repository);
    const mockedConfigRepository = mock(TwoFactorConfigD2Repository);
    const mockedProgramRepository = mock(UserMonitoringProgramD2Repository);
    const twoFactorUserOptions: TwoFactorUserOptions = {
        pushProgramId: { id: "fakeprogramid", name: "fakeprogramname" },
        twoFactorGroup: { id: "faketwofactorid", name: "faketwofactoriname" }
    };
    const user: TwoFactorUser[] = [{
        id: "fakeuserid",
        username: "fakeusername",
        twoFA: false
    },{
        id: "fakevaliduserid",
        username: "fakevalidusername",
        twoFA: true
    }]
    const programMetadata: UserMonitoringProgramMetadata = {
        id: "fakeprogramid",
        orgUnitId: "fakeorgunitid",
        programStageId: "fakeprogramstage",
        dataElements: [{id: "fakecountdataelementid", code: "ADMIN_users_without_two_factor_count_7_Events", name: "fakecountdataelementname"},
        {id: "fakeusersdataelementid", code: "ADMIN_users_without_two_factor_8_Events", name: "fakeusersdataelementname"}]
    }
    
    when(mockedUserRepository.getUsersByGroupId([twoFactorUserOptions.twoFactorGroup.id])).thenResolve(Promise.resolve(user));
    when(mockedConfigRepository.get()).thenResolve(twoFactorUserOptions);
    when(mockedProgramRepository.get(twoFactorUserOptions.pushProgramId.id)).thenResolve(Promise.resolve(programMetadata));

    when(mockedUserRepo.getCurrent()).thenReturn(Future.success(noAdminUser));
    userRepo = instance(mockedUserRepo);
    const users = this.userRepository.getUsersByGroupId([this.configRepository.get().twoFactorGroup.id]);
    const usersWithoutTwoFactor = users.filter(user => user.twoFA == false);
    return usersWithoutTwoFactor;

}

describe("Two Factor monitoring", () => {
    test("should report users with two-factor false", async () => {
        givenAdminUser();
        const dataElements = givenDataElements();

        const dataElementResponse = await new RunTwoFactorReportUseCase(dataElementRepo, userRepo)
            .execute()
            .toPromise();

        expect(dataElementResponse).toEqual(dataElements);
    });

    test("if user is not an admin should return an error", async () => {
        try {
            givenNoAdminUser();
            givenDataElements();

            const _dataElementResponse = await new GetDataElementsUseCase(dataElementRepo, userRepo)
                .execute()
                .toPromise();
        } catch (e) {
            expect(e).toEqual(new Error("This action is not allowed"));
        }
    });
});

describe("Get two factor users", () => {
    test("if exist some user without two factor activated should return that user", async () => {
        givenAdminUser();
        const dataElements = givenDataElements();

        const dataElementResponse = await new RunTwoFactorReportUseCase(dataElementRepo, userRepo)
            .execute()
            .toPromise();

        expect(dataElementResponse).toEqual(dataElements);
    });

    test("if user is not an admin should return an error", async () => {
        try {
            givenNoAdminUser();
            givenDataElements();

            const _dataElementResponse = await new GetDataElementsUseCase(dataElementRepo, userRepo)
                .execute()
                .toPromise();
        } catch (e) {
            expect(e).toEqual(new Error("This action is not allowed"));
        }
    });
}); */
