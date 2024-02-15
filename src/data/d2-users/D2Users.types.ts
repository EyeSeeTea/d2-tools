export type Id = string;

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
    userRoles: IdItem[];
}

export interface UserRoleAuthority {
    id: Id;
    authorities: string[];
    name: string;
}

export interface UserResult {
    user: User;
    validRoles: IdItem[];
    invalidRoles: IdItem[];
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

export interface UserCSV {
    id: Id;
    username: string;
    email: string;
    displayName: string;
    userGroups: string[];
    lastUpdatedBy: string;
    updated?: boolean;
    networkRes?: string;
    createdBy: string;
    userType: string;
    templateUser: string;
    validUserRoles: IdItem[];
    invalidUserRoles: IdItem[];
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
export interface IdItem {
    id: Id;
}

type StringDateTime = string;
