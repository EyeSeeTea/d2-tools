export interface UserDetails {
    id: Id;
    displayName: string;
    name: string;
    username: string;
}
export interface UserRes {
    user: User;
    fixedUser: User;
    validUserRoles: IdItem[];
    invalidUserRoles: IdItem[];
    actionRequired: boolean;
    updated?: boolean;
    networkRes?: string;
    userNameTemplate?: string;
    templateIdTemplate?: string;
    groupIdTemplate?: string;
    multipleUserGroups?: string[];
    undefinedUserGroups?: boolean;
    undefinedRoles?: boolean;
}

export interface UserRoleAuthority {
    id: Id;
    authorities: string[];
    name: string;
}
export interface User {
    id: Id;
    lastUpdatedBy: UserDetails;
    createdBy: UserDetails;
    twoFA: boolean;
    invitation: false;
    selftRefistered: false;
    firstName: string;
    phoneNumber: string;
    name: string;
    favorite: false;
    displayName: string;
    externalAuth: boolean;
    externalAccess: boolean;
    surname: string;
    disabled: boolean;
    email: string;
    passwordLastUpdated: StringDateTime;
    username: string;
    userCredentials: UserCredentials;
    userGroups: IdItem[];
    userRoles: IdItem[];
}

export interface UserCredentials {
    lastUpdated: string;
    lastLogin: string;
    passwordLastUpdated: StringDateTime;
    invitation: boolean;
    selfRegisterd: boolean;
    uid: Id;
    disabled: boolean;
    twoFA: boolean;
    username: string;
    userRoles: IdItem[];
}

export interface UserMonitoringDetails extends UserMonitoringCountResponse {
    usersBackup: User[];
    usersFixed: User[];
    eventid: string;
    userProcessed: UserRes[];
}

export type UserMonitoringCountResponse = {
    invalidUsersCount: number;
    listOfAffectedUsers: Item[];
    response: string;
};

export type UserWithoutTwoFactor = {
    invalidUsersCount: number;
    listOfAffectedUsers: Item[];
    response: string;
};

export interface UsersOptions {
    userRolesResponse?: UserMonitoringDetails;
    userGroupsResponse?: UserMonitoringCountResponse;
    templates: TemplateGroup[];
    excludedRoles: Item[];
    excludedUsers: Item[];
    excludedRolesByUser: RolesByUser[];
    excludedRolesByGroup: RolesByGroup[];
    excludedRolesByRole: RolesByRoles[];
    pushReport: boolean;
    pushProgramId: Item;
    minimalGroupId: Item;
    minimalRoleId: Item;
    twoFactorGroup: Item;
}

export interface TemplateGroup {
    group: Item;
    template: Item;
}

export interface TemplateGroupWithAuthorities extends TemplateGroup {
    validRolesByAuthority: UserRoleAuthority[];
    invalidRolesByAuthority: UserRoleAuthority[];
    validRolesById: string[];
    invalidRolesById: string[];
}

export interface RolesByRoles {
    active_role: Item;
    ignore_role: Item;
}

export interface RolesByUser {
    role: Item;
    user: Item;
}

export interface RolesByGroup {
    role: Item;
    group: Item;
}

export interface Item {
    id: string;
    name: string;
}

export interface AuthOptions {
    apiurl: string;
}

export type Id = string;
export type IdItem = {
    id: Id;
};

type StringDateTime = string;
