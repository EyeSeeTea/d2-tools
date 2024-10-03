import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import { RunUserPermissionUseCase } from "../RunUserPermissionUseCase";
import {
    fakeValidUser,
    metadataConfig,
    programMetadata,
    templateGroupsExtended,
} from "./RunUserPermissionTest.data";
import { describe, it, expect } from "vitest";
import { anything, deepEqual, instance, mock, when } from "ts-mockito";
import { PermissionFixerUserD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerUserD2Repository";
import { PermissionFixerUserGroupD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerUserGroupD2Repository";
import { PermissionFixerTemplateD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerTemplateD2Repository";
import { PermissionFixerReportD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerReportD2Repository";
import { PermissionFixerConfigD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerConfigD2Repository";
import { NamedRef } from "domain/entities/Base";
import { PermissionFixerMetadataConfig } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerConfigOptions";

describe("RunUserPermissionUseCase", () => {
    it("Should ignore user if the user is in the datastore excluded users list", async () => {
        const useCase = givenUseCaseIgnoreUser();

        const result = await useCase.execute();
        console.log(JSON.stringify(result));
        expect(result.groupsReport?.invalidUsersCount).toEqual(undefined);
        expect(result.groupsReport?.listOfAffectedUsers).toEqual(undefined);
        expect(result.rolesReport?.invalidUsersCount).toEqual(undefined);
        expect(result.rolesReport?.listOfAffectedUsers).toEqual(undefined);
        expect(result.message).toEqual("");
    });
});

function givenUseCaseIgnoreUser() {
    const useCase = new RunUserPermissionUseCase(
        givenConfigRepository(fakeValidUser),
        givenReportRepository(),
        givenTemplateRepository(),
        givenUserGroupRepository(),
        givenUserRepository(),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}

function givenConfigRepository(excludedUser: NamedRef) {
    const mockedRepository = mock(PermissionFixerConfigD2Repository);
    metadataConfig.excludedUsers = [excludedUser];
    when(mockedRepository.get()).thenReturn(Promise.resolve(metadataConfig));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}
function givenReportRepository() {
    const mockedRepository = mock(PermissionFixerReportD2Repository);
    when(mockedRepository.save(anything(), anything(), anything())).thenReturn(Promise.resolve("OK"));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}
function givenUserGroupRepository() {
    const mockedRepository = mock(PermissionFixerUserGroupD2Repository);
    when(mockedRepository.save(anything(), anything())).thenReturn(Promise.resolve("OK"));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}
function givenUserRepository() {
    const mockedRepository = mock(PermissionFixerUserD2Repository);
    when(mockedRepository.getAllUsers(anything(), anything())).thenReturn(Promise.resolve([fakeValidUser]));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}
function givenTemplateRepository() {
    const mockedRepository = mock(PermissionFixerTemplateD2Repository);
    when(mockedRepository.getTemplateAuthorities(anything(), anything())).thenReturn(
        Promise.resolve([templateGroupsExtended])
    );
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}
function givenUserMonitoringProgramD2Repository() {
    const mockedRepository = mock(UserMonitoringProgramD2Repository);
    when(mockedRepository.get(deepEqual(metadataConfig.pushProgram.id))).thenReturn(
        Promise.resolve(programMetadata)
    );
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}
