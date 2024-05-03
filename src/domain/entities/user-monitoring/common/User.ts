import { Id, NamedRef } from "domain/entities/Base";
import { UserCredentials } from "./UserCredentials";
import { UserDetails } from "./UserDetails";

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
    userGroups: NamedRef[];
    userRoles: NamedRef[];
}
type StringDateTime = string;
