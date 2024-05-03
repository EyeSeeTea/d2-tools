import { Ref, Id, StringDateTime } from "domain/entities/Base";

export interface UserDetails {
    id: Id;
    displayName: string;
    name: string;
    username: string;
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
    userRoles: Ref[];
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
    userGroups: Ref[];
    userRoles: Ref[];
}

export interface Program {
    program: string;
    programStages: ProgramStage[];
    organisationUnits: Id[];
}

export interface ProgramStage {
    id: string;
    programStageDataElements: ProgramStageDataElement[];
}

export interface ProgramStageDataElement {
    name: string;
    code: string;
    dataElement: DataElement;
}

export interface ProgramMetadata {
    id: string;
    programStageId: string;
    dataElements: DataElement[];
    orgUnitId: string;
}

export interface EventDataValue {
    dataElement: Id;
    value: string | number;
}
export interface DataElement {
    id: string;
    code: string;
    name: string;
}
