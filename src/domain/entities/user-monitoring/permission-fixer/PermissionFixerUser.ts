import { Id, NamedRef, StringDateTime } from "domain/entities/Base";

export interface PermissionFixerUser {
    id: Id;
    lastUpdatedBy: PermissionFixerUserDetails;
    createdBy: PermissionFixerUserDetails;
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
    userCredentials: PermissionFixerUserCredentials;
    userGroups: NamedRef[];
    userRoles: NamedRef[];
}

export interface PermissionFixerUserCredentials {
    lastUpdated: string;
    lastLogin: string;
    passwordLastUpdated: StringDateTime;
    invitation: boolean;
    selfRegisterd: boolean;
    uid: Id;
    disabled: boolean;
    twoFA: boolean;
    twoFactorEnabled: boolean;
    username: string;
    userRoles: NamedRef[];
}

export interface PermissionFixerUserDetails {
    id: Id;
    displayName: string;
    name: string;
    username: string;
}
