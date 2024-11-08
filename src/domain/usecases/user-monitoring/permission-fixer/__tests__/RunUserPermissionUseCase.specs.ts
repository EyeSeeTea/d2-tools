import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import { RunUserPermissionUseCase } from "../RunUserPermissionUseCase";
import {
    baseMetadataConfig,
    fakeInvalidUser,
    fakeTemplateUser,
    fakeUserWithoutUserGroup,
    fakeValidUser,
    permissionFixerTemplateGroupExtended,
    programMetadata,
    templateGroupsExtended,
} from "./RunUserPermissionTest.data";
import { describe, it, expect,beforeEach } from "vitest";
import { anything, instance, mock, when, deepEqual } from "ts-mockito";
import { PermissionFixerUserD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerUserD2Repository";
import { PermissionFixerUserGroupD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerUserGroupD2Repository";
import { PermissionFixerTemplateD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerTemplateD2Repository";
import { PermissionFixerReportD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerReportD2Repository";
import { PermissionFixerConfigD2Repository } from "data/user-monitoring/permission-fixer/PermissionFixerConfigD2Repository";
import { PermissionFixerUser } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUser";
import { PermissionFixerMetadataConfig } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerConfigOptions";
import { fail } from "assert";
import { PermissionFixerTemplateGroupExtended } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerTemplates";


let configWithUserExcluded: PermissionFixerMetadataConfig;
let clonedBasicMetadata: PermissionFixerMetadataConfig;
let configThrowInvalidUsergroupException: PermissionFixerMetadataConfig;

let clonedMetadataConfig: PermissionFixerMetadataConfig;
let clonedMetadataConfigWrongMinimalUserGroup : PermissionFixerMetadataConfig;
let clonedFakeUserWithoutGroup : PermissionFixerUser;
let clonedValidUser : PermissionFixerUser;
let clonedTemplateUser : PermissionFixerUser;
let clonedInvalidUser : PermissionFixerUser;
let clonedWrongMinimalUserGroupConfig: PermissionFixerMetadataConfig;

let configWithUserGroupDisabled: PermissionFixerMetadataConfig;
let configWithWrongMinimalGroup: PermissionFixerMetadataConfig;
let clonedTemplateAuthorities: PermissionFixerTemplateGroupExtended;

describe("RunUserPermissionUseCase", () => {
    it("Should ignore user if the user is in the datastore excluded users list", async () => {
        const useCase = givenUseCaseIgnoreUser();

        const result = await useCase.execute();

        console.log(JSON.stringify(result));
        expect(result.userTemplates).toEqual([]);
        expect(result.excludedUsers[0]).toEqual(getValidUser());
        expect(result.groupsReport).toEqual(undefined);
        expect(result.rolesReport).toEqual(undefined);
        expect(result.message).toEqual("Nothing to report. No invalid users found.");
    }); 

    it("Should ignore user if the user has valid roles", async () => {
        const useCase = givenUseCaseValidUser();

        const result = await useCase.execute();

        expect(result.userTemplates).toEqual([]);
        expect(result.groupsReport).toEqual(undefined);
        expect(result.rolesReport).toEqual(undefined);
        console.log(JSON.stringify(result));
        expect(result.message).toEqual("Nothing to report. No invalid users found.");
    });

    it("Should fix user if the user has invalid authorities", async () => {
        const useCase = givenUseCaseInvalidUser();

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
    
    it("Should throw exception if some user dont have valid user template groups and user group fix is disabled", async () => {
        const useCase = givenUseCaseUserWithoutTemplateUserGroupAndIgnorefix();

        const result = useCase.execute();

        expect(result).rejects.toThrowError("User: userusername don't have valid groups");
    });

    it("Should fix add minimal group if a user dont have any control template user group", async () => {
        const useCase = givenUseCaseUserWithoutTemplateUserGroup();

        const result = await useCase.execute();
        expect(result.groupsReport?.invalidUsersCount).toEqual(1);
        expect(result.groupsReport?.listOfAffectedUsers[0]).toEqual({
            id: "CHbcHcmgoZ5",
            name: "userusername",
          });
        expect(result.rolesReport?.invalidUsersCount).toEqual(0);
        expect(result.message).toEqual("OK");
    });
    
    /*
    it("Should push fixed usergroup if the user has no template usergroups", async () => {
        const useCase = givenUseCaseUserWithoutTemplateUserGroup();

        const result = await useCase.execute();
        expect(result.groupsReport?.invalidUsersCount).toEqual(0);
        expect(result.groupsReport?.listOfAffectedUsers).toEqual(undefined);
        expect(result.rolesReport?.invalidUsersCount).toEqual(undefined);
        expect(result.rolesReport?.listOfAffectedUsers).toEqual(undefined);
        expect(result.message).toEqual("Nothing to report. No invalid users found.");
    }); */
});


beforeEach(() => {
    clonedFakeUserWithoutGroup = copyObject(fakeUserWithoutUserGroup);
    clonedValidUser = copyObject(fakeValidUser);
    clonedTemplateUser = copyObject(fakeTemplateUser);
    clonedInvalidUser = copyObject(fakeInvalidUser);
    clonedFakeUserWithoutGroup = copyObject(fakeUserWithoutUserGroup)
    clonedBasicMetadata = copyObject(baseMetadataConfig);
    configWithWrongMinimalGroup = copyObject(baseMetadataConfig);
    configWithWrongMinimalGroup.minimalGroup = {
        id: "IKpEgoQ4S03",
        name: "WrongMinimal group uid",
    };
    configWithWrongMinimalGroup.permissionFixerConfig.forceMinimalGroupForUsersWithoutGroup = false
    configWithWrongMinimalGroup.permissionFixerConfig.pushFixedUserGroups = true

    configWithUserExcluded = copyObject(baseMetadataConfig);
    configWithUserExcluded.excludedUsers = [copyObject(fakeValidUser)];
    configThrowInvalidUsergroupException = copyObject(baseMetadataConfig);
    clonedTemplateAuthorities = copyObject(permissionFixerTemplateGroupExtended);

});

function getMetadataConfig(): PermissionFixerMetadataConfig {
    return baseMetadataConfig;
}


function getMetataConfiThrowInvalidUsergroupException(): PermissionFixerMetadataConfig {
    return configThrowInvalidUsergroupException;
}

function getMetataConfigWithExcludedUser(): PermissionFixerMetadataConfig {
    return configWithUserExcluded;
}

function getWrongMinimalUserGroupConfig(): PermissionFixerMetadataConfig {
    return configWithWrongMinimalGroup
}
function getMetadata(): PermissionFixerMetadataConfig{
    return clonedBasicMetadata;
}
function getValidUser(): PermissionFixerUser{
    return clonedValidUser
}

function getTemplateUser(): PermissionFixerUser{
    return clonedTemplateUser
}

function getInvalidUser(): PermissionFixerUser{
    return clonedInvalidUser
}


function getUserWithoutGroup(): PermissionFixerUser {
    return clonedFakeUserWithoutGroup;
}

function givenUseCaseUserWithoutTemplateUserGroupAndIgnorefix() {
    const useCase = new RunUserPermissionUseCase(
        givenConfigRepositoryThrowException(),
        givenReportRepository(),
        givenTemplateRepository(),
        givenUserGroupRepository(),
        givenUserRepository([getUserWithoutGroup()]),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}
function givenUseCaseIgnoreUser() {
    const useCase = new RunUserPermissionUseCase(
        givenConfigRepositoryExcludeUser(),
        givenReportRepository(),
        givenTemplateRepository(),
        givenUserGroupRepository(),
        givenUserRepository([getValidUser()]),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}
function givenUseCaseValidUser(){
    const useCase = new RunUserPermissionUseCase(
        givenBasicConfigRepository(),
        givenReportRepository(),
        givenTemplateRepository(),
        givenUserGroupRepository(),
        givenUserRepository([getValidUser()]),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;

}
function givenUseCaseInvalidUser(){
    const useCase = new RunUserPermissionUseCase(
        givenBasicConfigRepository(),
        givenReportRepository(),
        givenTemplateCustomRepository(),
        givenUserGroupRepository(),
        givenUserRepository([getInvalidUser()]),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;

}

function givenUseCaseUserWithoutTemplateUserGroup(){
    const useCase = new RunUserPermissionUseCase(
        givenConfigRepositoryWrongMinimalUserGroup(),
        givenReportRepository(),
        givenTemplateRepository(),
        givenUserGroupRepository(),
        givenUserRepositoryFixedUsergroup([getUserWithoutGroup()]),
        givenUserMonitoringProgramD2Repository()
    );
    return useCase;
}
function givenBasicConfigRepository() {
    const mockedRepository = mock(PermissionFixerConfigD2Repository);
    when(mockedRepository.get()).thenReturn(Promise.resolve(getMetadataConfig()));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenConfigRepositoryExcludeUser() {
    const mockedRepository = mock(PermissionFixerConfigD2Repository);
    when(mockedRepository.get()).thenReturn(Promise.resolve(getMetataConfigWithExcludedUser()));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}


function givenConfigRepositoryWrongMinimalUserGroup() {
    const mockedRepository = mock(PermissionFixerConfigD2Repository);
    when(mockedRepository.get()).thenReturn(Promise.resolve(getWrongMinimalUserGroupConfig()));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}


function givenConfigRepositoryThrowException() {
    const mockedRepository = mock(PermissionFixerConfigD2Repository);
    when(mockedRepository.get()).thenReturn(Promise.resolve(getMetataConfiThrowInvalidUsergroupException()));
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
    when(mockedRepository.getAllUsers()).thenReturn(Promise.resolve(JSON.parse(JSON.stringify((users)))));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenUserRepositoryFixedUsergroup(users: PermissionFixerUser[]) {
    const mockedRepository = mock(PermissionFixerUserD2Repository);
    when(mockedRepository.getAllUsers()).thenReturn(Promise.resolve(JSON.parse(JSON.stringify((users)))),Promise.resolve([JSON.parse(JSON.stringify((clonedValidUser)))]));
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}
function givenTemplateRepository() {
    const mockedRepository = mock(PermissionFixerTemplateD2Repository);
    when(mockedRepository.getTemplateAuthorities(anything(), anything())).thenReturn(
        Promise.resolve([JSON.parse(JSON.stringify((permissionFixerTemplateGroupExtended)))])
    );
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenTemplateCustomRepository() {
    const mockedRepository = mock(PermissionFixerTemplateD2Repository);
    when(mockedRepository.getTemplateAuthorities(anything(), anything())).thenReturn(
        Promise.resolve([clonedTemplateAuthorities])
    );
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}

function givenUserMonitoringProgramD2Repository() {
    const mockedRepository = mock(UserMonitoringProgramD2Repository);
    when(mockedRepository.get(getMetadataConfig().pushProgram.id)).thenReturn(
        Promise.resolve(JSON.parse(JSON.stringify((programMetadata))))
    );
    const reportRepository = instance(mockedRepository);
    return reportRepository;
}


function copyObject (value:any){
    return JSON.parse(JSON.stringify(value))
}