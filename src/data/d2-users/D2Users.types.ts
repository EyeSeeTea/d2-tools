import { UserField } from "capture-core/components/FormFields/UserField";
import { TemplateGroup } from "domain/repositories/UsersRepository";
import { UserInfo } from "os";

export type Id = string;
export interface UserDetails {
    id: Id;
    displayName: string;
    name: string;
    username: string;
}

export interface UserCreedentials {
    lastLogin: StringDateTime;
    passwordLastUpdated: StringDateTime;
    invitation: boolean;
    selfRegisterd: boolean;
    uid: Id;
    disabled: boolean;
    twoFA: boolean;
    username: string;
    userRoles: IdItem[];
}

export interface UserRes {
    fixedUser: User,
    validUserRoles: IdItem[],
    invalidUserRoles: IdItem[],
    actionRequired: boolean,
    updated?: boolean,
    networkRes?: string,
    userTemplate?: User,
    groupTemplate?: UserGroup
}
export interface UserCSV {
    id: Id,
    username: string,
    email: string,
    displayName: string,
    userGroups: string[],
    lastUpdatedBy: string,
    updated?: boolean,
    networkRes?: string,
    createdBy: string,
    userType: string,
    templateUser: string,
    validUserRoles: IdItem[],
    invalidUserRoles: IdItem[]
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
    userCredentials: UserCreedentials;
    userGroups: IdItem[];
    userRoles: IdItem[];
}
export interface UserRole {
    created: StringDateTime;
    lastUpdated: StringDateTime;
    name: string;
    id: string;
    description: string;
    lastUpdatedBy: UserDetails;
    authorities: string[];
    users: IdItem[];
}
export interface UserGroup {
    created: StringDateTime;
    lastUpdated: StringDateTime;
    name: string;
    id: string;
    users: IdItem[];
}
export interface IdItem {
    id: Id;
}

type StringDateTime = string;
