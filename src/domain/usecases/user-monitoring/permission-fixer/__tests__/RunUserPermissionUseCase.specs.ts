import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import { RunUserPermissionUseCase } from "../RunUserPermissionUseCase";
import {
    fakeInvalidUser,
    fakeTemplateUser,
    fakeUserWithoutUserGroup,
    fakeValidUser,
    metadataConfig,
    metadataConfigWrongMinimaLUserGroup as metadataConfigWrongMinimalUserGroup,
    permissionFixerTemplateGroupExtended,
    programMetadata,
} from "./RunUserPermissionTest.data";
import { describe, it, expect } from "vitest";
import { anything, deepEqual, instance, mock, when } from "ts-mockito";
import { PermissionFixerUserD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerUserD2Repository";
import { PermissionFixerUserGroupD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerUserGroupD2Repository";
import { PermissionFixerTemplateD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerTemplateD2Repository";
import { PermissionFixerReportD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerReportD2Repository";
import { PermissionFixerConfigD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerConfigD2Repository";
import { NamedRef } from "domain/entities/Base";
import { PermissionFixerUser } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUser";
import { PermissionFixerMetadataConfig } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerConfigOptions";

describe("RunUserPermissionUseCase", () => {
    it("Should ignore user if the user is in the datastore excluded users list", async () => {
        const useCase = givenUseCaseIgnoreUser();

        const result = await useCase.execute();

        console.log(JSON.stringify(result));
        expect(result.userTemplates).toEqual([]);
        expect(result.excludedUsers[0]).toEqual(fakeValidUser);
        expect(result.groupsReport).toEqual(undefined);
        expect(result.rolesReport).toEqual(undefined);
        expect(result.message).toEqual("Nothing to report. No invalid users found.");
    });
});

describe("RunUserPermissionUseCase", () => {
    it("Should ignore user if the user has valid roles", async () => {
        const useCase = givenUseCaseValidUser();

        const result = await useCase.execute();

        expect(result.userTemplates).toEqual([]);
        expect(result.groupsReport).toEqual(undefined);
        expect(result.rolesReport).toEqual(undefined);
        console.log(JSON.stringify(result));
        expect(result.message).toEqual("Nothing to report. No invalid users found.");
    });
});

describe("RunUserPermissionUseCase", () => {
    it("Should fix user if the user has invalid authorities", async () => {
        const useCase = givenUseCaseInvalidUser();

        const result = await useCase.execute();

        console.log(JSON.stringify(result));
        expect(result.groupsReport?.invalidUsersCount).toEqual(0);
        expect(result.rolesReport?.invalidUsersCount).toEqual(1);
        expect(result.rolesReport?.usersBackup[0]?.userRoles).toEqual([
            {
                id: "invalidRoleId",
                name: "invalid userRole name",
            },
            {
                id: "tocVqzvmpI0",
                name: "userRole name",
            },
        ]);
        expect(result.rolesReport?.usersFixed[0]?.userRoles).toEqual([]);
        //todo -> add to the test the list of userRoles, but we need mock the userRole-authorities call
    });
});

describe("RunUserPermissionUseCase", () => {
    it("Should throw exception if some user dont have valid user template groups and user group fix is disabled", async () => {
        const useCase = givenUseCaseUserWithoutTemplateUserGroupAndIgnorefix();

        const result = useCase.execute();

        await expect(result).rejects.toThrowError("User: userusername don't have valid groups");
    });
});
describe("RunUserPermissionUseCase", () => {
    it("Should fix add minimal group if a user dont have any control template user group", async () => {
        const useCase = givenUseCaseUserWithoutTemplateUserGroup();

        const result = await useCase.execute();

        expect(result.groupsReport?.invalidUsersCount).toEqual(1);
        expect(result.groupsReport?.listOfAffectedUsers).toEqual(undefined);
        expect(result.rolesReport?.invalidUsersCount).toEqual(undefined);
        expect(result.rolesReport?.listOfAffectedUsers).toEqual(undefined);
        expect(result.message).toEqual("Nothing to report. No invalid users found.");
    });
});

describe("RunUserPermissionUseCase", () => {
    it("Should push fixed usergroup if the user has no template usergroups", async () => {
        const useCase = givenUseCaseUserWithoutTemplateUserGroup();

        const result = await useCase.execute();
        expect(result.groupsReport?.invalidUsersCount).toEqual(result);
        expect(result.groupsReport?.listOfAffectedUsers).toEqual(undefined);
        expect(result.rolesReport?.invalidUsersCount).toEqual(undefined);
        expect(result.rolesReport?.listOfAffectedUsers).toEqual(undefined);
        expect(result.message).toEqual("Nothing to report. No invalid users found.");
    });
});

function givenUseCaseIgnoreUser() {
    const useCase = new RunUserPermissionUseCase(
        givenConfigRepositoryExcludeUser(fakeValidUser),
        givenReportRepository(),
        givenTemplateRepository(),
        givenUserGroupRepository(),
        givenUserRepository([fakeValidUser]),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}

function givenUseCaseValidUser() {
    const useCase = new RunUserPermissionUseCase(
        givenConfigRepositoryExcludeUser(undefined),
        givenReportRepository(),
        givenTemplateRepository(),
        givenUserGroupRepository(),
        givenUserRepository([fakeValidUser, fakeTemplateUser]),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}

function givenUseCaseInvalidUser() {
    const useCase = new RunUserPermissionUseCase(
        givenConfigRepositoryExcludeUser(undefined),
        givenReportRepository(),
        givenTemplateRepository(),
        givenUserGroupRepository(),
        givenUserRepository([fakeInvalidUser, fakeTemplateUser]),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}

function givenUseCaseFixUser() {
    const useCase = new RunUserPermissionUseCase(
        givenConfigRepositoryExcludeUser(fakeInvalidUser),
        givenReportRepository(),
        givenTemplateRepository(),
        givenUserGroupRepository(),
        givenUserRepository([fakeInvalidUser, fakeTemplateUser]),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}
function givenUseCaseUserWithoutTemplateUserGroup() {
    const useCase = new RunUserPermissionUseCase(
        givenConfigRepository(metadataConfig),
        givenReportRepository(),
        givenTemplateRepository(),
        givenUserGroupRepository(),
        givenUserRepository([fakeUserWithoutUserGroup]),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}

function givenUseCaseUserWithoutTemplateUserGroupAndIgnorefix() {
    const useCase = new RunUserPermissionUseCase(
        givenConfigRepository(metadataConfigWrongMinimalUserGroup),
        givenReportRepository(),
        givenTemplateRepository(),
        givenUserGroupRepository(),
        givenUserRepository([fakeUserWithoutUserGroup]),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}

function givenUseCaseUserWithInvalidAuthority() {
    const useCase = new RunUserPermissionUseCase(
        givenConfigRepository(metadataConfig),
        givenReportRepository(),
        givenTemplateRepository(),
        givenUserGroupRepository(),
        givenUserRepository([fakeValidUser]),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}

function givenConfigRepositoryExcludeUser(excludedUser: NamedRef | undefined) {
    const mockedRepository = mock(PermissionFixerConfigD2Repository);
    if (excludedUser) metadataConfig.excludedUsers = [excludedUser];
    when(mockedRepository.get()).thenReturn(Promise.resolve(metadataConfig));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenConfigRepository(config: PermissionFixerMetadataConfig) {
    const mockedRepository = mock(PermissionFixerConfigD2Repository);
    when(mockedRepository.get()).thenReturn(Promise.resolve(config));
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
function givenUserRepository(users: PermissionFixerUser[]) {
    const mockedRepository = mock(PermissionFixerUserD2Repository);
    when(mockedRepository.getAllUsers()).thenReturn(Promise.resolve(users));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenTemplateRepository() {
    const mockedRepository = mock(PermissionFixerTemplateD2Repository);
    when(mockedRepository.getTemplateAuthorities(anything(), anything())).thenReturn(
        Promise.resolve([permissionFixerTemplateGroupExtended])
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
