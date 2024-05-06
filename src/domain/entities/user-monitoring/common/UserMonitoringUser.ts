import { Id, NamedRef, StringDateTime } from "domain/entities/Base";

export interface UserMonitoringUser {
    id: Id;
    lastUpdatedBy: UserMonitoringUserDetails;
    createdBy: UserMonitoringUserDetails;
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
    userCredentials: UserMonitoringUserCredentials;
    userGroups: NamedRef[];
    userRoles: NamedRef[];
}

export interface UserMonitoringUserCredentials {
    lastUpdated: string;
    lastLogin: string;
    passwordLastUpdated: StringDateTime;
    invitation: boolean;
    selfRegisterd: boolean;
    uid: Id;
    disabled: boolean;
    twoFA: boolean;
    username: string;
    userRoles: NamedRef[];
}

export interface UserMonitoringUserDetails {
    id: Id;
    displayName: string;
    name: string;
    username: string;
}
