import { Id, NamedRef } from "domain/entities/Base";

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
    userRoles: NamedRef[];
}

type StringDateTime = string;
