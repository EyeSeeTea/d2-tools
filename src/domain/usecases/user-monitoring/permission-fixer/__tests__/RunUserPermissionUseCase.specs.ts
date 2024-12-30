import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import { RunUserPermissionUseCase } from "../RunUserPermissionUseCase";
import {
    baseMetadataConfig,
    fakeInvalidUser,
    fakeUserWithoutUserGroup,
    fakeValidUser,
    permissionFixerTemplateGroupsExtended,
    programMetadata,
} from "./RunUserPermissionTest.data";
import { describe, it, expect, beforeEach } from "vitest";
import { anything, instance, mock, when } from "ts-mockito";
import { PermissionFixerUserD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerUserD2Repository";
import { PermissionFixerUserGroupD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerUserGroupD2Repository";
import { PermissionFixerTemplateD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerTemplateD2Repository";
import { PermissionFixerReportD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerReportD2Repository";
import { PermissionFixerConfigD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerConfigD2Repository";
import { PermissionFixerUser } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUser";
import { PermissionFixerMetadataConfig } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerConfigOptions";
import { PermissionFixerTemplateGroupExtended } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerTemplates";
import { PermissionFixerUserRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerUserRepository";
import { UserMonitoringProgramMetadata } from "domain/entities/user-monitoring/common/UserMonitoringProgramMetadata";

let configWithUserExcluded: PermissionFixerMetadataConfig;
let configThrowInvalidUsergroupException: PermissionFixerMetadataConfig;
let basicConfig: PermissionFixerMetadataConfig;
let clonedFakeUserWithoutGroup: PermissionFixerUser;
let clonedValidUser: PermissionFixerUser;
let clonedInvalidUser: PermissionFixerUser;
let configWithWrongMinimalGroup: PermissionFixerMetadataConfig;
let clonedTemplateAuthorities: PermissionFixerTemplateGroupExtended[];
let clonedInvalidTemplateAuthorities: PermissionFixerTemplateGroupExtended[];

describe("RunUserPermissionUseCase", () => {
    it("Should ignore user if the user is in the datastore excluded users list", async () => {
        const useCase = givenUseCaseCustomUsers(
            givenUserRepository([clonedValidUser]),
            givenConfigRepository(configWithUserExcluded),
            givenTemplateRepository(clonedTemplateAuthorities)
        );

        const result = await useCase.execute();

        console.log(JSON.stringify(result));
        expect(result.userTemplates).toEqual([]);
        expect(result.excludedUsers[0]).toEqual(clonedValidUser);
        expect(result.groupsReport).toEqual(undefined);
        expect(result.rolesReport).toEqual(undefined);
        expect(result.message).toEqual("Nothing to report. No invalid users found.");
    });

    it("Should ignore user if the user has valid roles", async () => {
        const useCase = givenUseCaseCustomUsers(
            givenUserRepository([clonedValidUser]),
            givenConfigRepository(configThrowInvalidUsergroupException),
            givenTemplateRepository(clonedTemplateAuthorities)
        );

        const result = await useCase.execute();

        expect(result.userTemplates).toEqual([]);
        expect(result.groupsReport).toEqual(undefined);
        expect(result.rolesReport).toEqual(undefined);
        console.log(JSON.stringify(result));
        expect(result.message).toEqual("Nothing to report. No invalid users found.");
    });

    it("Should fix user if the user has invalid authorities", async () => {
        const useCase = givenUseCaseCustomUsers(
            givenUserRepository([clonedInvalidUser]),
            givenConfigRepository(configThrowInvalidUsergroupException),
            givenTemplateRepository(clonedTemplateAuthorities)
        );

        const result = await useCase.execute();

        console.log(JSON.stringify(result));
        expect(result.groupsReport?.invalidUsersCount).toEqual(0);
        expect(result.rolesReport?.invalidUsersCount).toEqual(1);
        expect(result.rolesReport?.usersBackup[0]?.userRoles).toEqual([
            {
                id: "invalidRoleId",
                name: "Invalid dummy role",
            },
            {
                id: "BQEME6bsUpZ",
                name: "Dummy authority",
            },
        ]);
        expect(result.rolesReport?.usersFixed[0]?.userRoles).toEqual([
            {
                id: "BQEME6bsUpZ",
                name: "Dummy authority",
            },
        ]);
    });

    it("Should throw exception if the user don't have a valid user template group and fix is disabled", async () => {
        const useCase = givenUseCaseCustomUsers(
            givenUserRepository([clonedFakeUserWithoutGroup]),
            givenConfigRepository(configThrowInvalidUsergroupException),
            givenTemplateRepository(clonedInvalidTemplateAuthorities)
        );

        const result = useCase.execute();

        expect(result).rejects.toThrowError("User: userusername don't have valid groups");
    });

    it("Should fix add minimal group if a user dont have any control template user group", async () => {
        const useCase = givenUseCaseCustomUsers(
            givenUserRepository([clonedFakeUserWithoutGroup], clonedValidUser),
            givenConfigRepository(configWithWrongMinimalGroup),
            givenTemplateRepository(clonedTemplateAuthorities)
        );

        const result = await useCase.execute();
        expect(result.groupsReport?.invalidUsersCount).toEqual(1);
        expect(result.groupsReport?.listOfAffectedUsers[0]).toEqual({
            id: "CHbcHcmgoZ5",
            name: "userusername",
        });
        expect(result.rolesReport?.invalidUsersCount).toEqual(0);
        expect(result.message).toEqual("OK");
    });

    it("Should push fixed usergroup if the user has no template usergroups", async () => {
        const useCase = givenUseCaseCustomUsers(
            givenUserRepository([clonedFakeUserWithoutGroup], clonedValidUser),
            givenConfigRepository(configWithWrongMinimalGroup),
            givenTemplateRepository(clonedTemplateAuthorities)
        );

        const result = await useCase.execute();
        expect(result.groupsReport?.invalidUsersCount).toEqual(1);
        expect(result.groupsReport?.listOfAffectedUsers).toEqual([
            {
                id: "CHbcHcmgoZ5",
                name: "userusername",
            },
        ]);
        expect(result.rolesReport?.invalidUsersCount).toEqual(0);
        expect(result.rolesReport?.listOfAffectedUsers).toEqual([]);
        expect(result.message).toEqual("OK");
    });

    it("Should apply minimal control template group if a user dont have any control template user group", async () => {
        const useCase = givenUseCaseCustomUsers(
            givenUserRepository([clonedFakeUserWithoutGroup], clonedValidUser),
            givenConfigRepository(configWithWrongMinimalGroup),
            givenTemplateRepository(clonedTemplateAuthorities)
        );

        const result = await useCase.execute();
        expect(result.groupsReport?.invalidUsersCount).toEqual(1);
        expect(result.groupsReport?.listOfAffectedUsers[0]).toEqual({
            id: "CHbcHcmgoZ5",
            name: "userusername",
        });
        expect(result.rolesReport?.invalidUsersCount).toEqual(0);
        expect(result.message).toEqual("OK");
    });
});

beforeEach(() => {
    clonedFakeUserWithoutGroup = copyObject(fakeUserWithoutUserGroup);
    clonedValidUser = copyObject(fakeValidUser);
    clonedInvalidUser = copyObject(fakeInvalidUser);
    clonedFakeUserWithoutGroup = copyObject(fakeUserWithoutUserGroup);
    configWithWrongMinimalGroup = copyObject(baseMetadataConfig);
    configWithWrongMinimalGroup.minimalGroup = {
        id: "IKpEgoQ4S03",
        name: "WrongMinimal group uid",
    };
    configWithWrongMinimalGroup.permissionFixerConfig.forceMinimalGroupForUsersWithoutGroup = false;
    configWithWrongMinimalGroup.permissionFixerConfig.pushFixedUserGroups = true;
    basicConfig = copyObject(baseMetadataConfig);
    configWithUserExcluded = copyObject(baseMetadataConfig);
    configWithUserExcluded.excludedUsers = [copyObject(fakeValidUser)];
    configThrowInvalidUsergroupException = copyObject(baseMetadataConfig);
    clonedTemplateAuthorities = copyObject(permissionFixerTemplateGroupsExtended);
    const permissionFixerInvalidTemplateGroupsExtended: PermissionFixerTemplateGroupExtended = copyObject(
        permissionFixerTemplateGroupsExtended[0]
    );
    permissionFixerInvalidTemplateGroupsExtended.group = { id: "notValidGroup", name: "not valid group" };
    clonedInvalidTemplateAuthorities = copyObject([permissionFixerInvalidTemplateGroupsExtended]);
});

function givenUseCaseCustomUsers(
    userRepository: PermissionFixerUserRepository,
    mockedConfigRepository: PermissionFixerConfigD2Repository,
    mockedTemplateRepository: PermissionFixerTemplateD2Repository
) {
    const useCase = new RunUserPermissionUseCase(
        mockedConfigRepository,
        givenReportRepository("OK"),
        mockedTemplateRepository,
        givenUserGroupRepository("OK"),
        userRepository,
        givenUserMonitoringProgramD2Repository(programMetadata)
    );
    return useCase;
}

function givenConfigRepository(config: PermissionFixerMetadataConfig) {
    const mockedRepository = mock(PermissionFixerConfigD2Repository);
    when(mockedRepository.get()).thenReturn(Promise.resolve(config));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenReportRepository(result: string) {
    const mockedRepository = mock(PermissionFixerReportD2Repository);
    when(mockedRepository.save(anything(), anything(), anything())).thenReturn(Promise.resolve(result));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenUserGroupRepository(result: string) {
    const mockedRepository = mock(PermissionFixerUserGroupD2Repository);
    when(mockedRepository.save(anything(), anything())).thenReturn(Promise.resolve(result));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenUserRepository(users: PermissionFixerUser[], usersFromApi?: PermissionFixerUser) {
    const mockedRepository = mock(PermissionFixerUserD2Repository);
    if (usersFromApi == undefined) {
        when(mockedRepository.getAllUsers()).thenReturn(Promise.resolve(JSON.parse(JSON.stringify(users))));
    } else {
        when(mockedRepository.getAllUsers()).thenReturn(
            Promise.resolve(JSON.parse(JSON.stringify(users))),
            Promise.resolve([JSON.parse(JSON.stringify(usersFromApi))])
        );
    }
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenTemplateRepository(template: PermissionFixerTemplateGroupExtended[]) {
    const mockedRepository = mock(PermissionFixerTemplateD2Repository);
    when(mockedRepository.getTemplateAuthorities(anything(), anything())).thenReturn(
        Promise.resolve(JSON.parse(JSON.stringify(template)))
    );
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenUserMonitoringProgramD2Repository(programMetadata: UserMonitoringProgramMetadata) {
    const mockedRepository = mock(UserMonitoringProgramD2Repository);
    when(mockedRepository.get(basicConfig.pushProgram.id)).thenReturn(
        Promise.resolve(JSON.parse(JSON.stringify(programMetadata)))
    );
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function copyObject(value: any) {
    return JSON.parse(JSON.stringify(value));
}
