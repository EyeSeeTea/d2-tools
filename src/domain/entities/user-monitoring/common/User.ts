import { Id, IdItem } from "./Identifier";
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
    userGroups: IdItem[];
    userRoles: IdItem[];
}
type StringDateTime = string;
