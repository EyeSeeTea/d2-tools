import { Access, AccessString, UserAccess, UserGroupAccess } from "domain/entities/Access";
import { AttributeValue } from "domain/entities/AttributeValue";
import { Id, Username, NamedRef, StringDateTime, Ref } from "domain/entities/Base";
import { Translation } from "domain/entities/Translation";
import { UserReference } from "domain/entities/UserReference";

export type User = {
    id: Id;
    username: Username;
    lastUpdated: StringDateTime;
    created: string;
    twoFA?: boolean;
    twoFactorEnabled?: boolean;
    invitation: boolean;
    selfRegistered: boolean;
    firstName: string;
    name: string;
    favorite: boolean;
    displayName: string;
    externalAuth: boolean;
    externalAccess: boolean;
    surname: string;
    disabled: boolean;
    lastUpdatedBy: UserReference;
    sharing: Sharing;
    access: Access;
    userCredentials: UserCredentials;
    createdBy: UserReference;
    user: UserReference;
    translations: Translation[];
    dataViewOrganisationUnits: Ref[];
    attributeValues: AttributeValue[];
    userGroups: NamedRef[];
    userRoles: NamedRef[];
    userAccesses: UserAccess[];
    userGroupAccesses: UserGroupAccess[];
    favorites: string[];
    cogsDimensionConstraints: Ref[];
    catDimensionConstraints: Ref[];
    teiSearchOrganisationUnits: Ref[];
    organisationUnits: Ref[];
};

type Sharing = {
    userGroups: Record<Id, IdAccess>;
    external: boolean;
    users: Record<Id, IdAccess>;
};

type IdAccess = { id: Id; access: AccessString };

type UserCredentials = {
    externalAuth: boolean;
    disabled: boolean;
    id: string;
    twoFA?: boolean;
    twoFactorEnabled?: boolean;
    invitation: boolean;
    selfRegistered: boolean;
    username: string;
    access: Access;
    sharing: Sharing;
    cogsDimensionConstraints: Ref[];
    catDimensionConstraints: Ref[];
    previousPasswords?: string[];
};

type MembershipChanges = {
    userRolesLost: NamedRef[];
    userRolesAdded: NamedRef[];
    userGroupsLost: NamedRef[];
    userGroupsAdded: NamedRef[];
};

export type UserTemplateDiff = {
    id: Id;
    username: Username;
    newProps: Partial<User>;
    changedPropsLost: Partial<User>;
    changedPropsAdded: Partial<User>;
    membershipChanges: MembershipChanges;
};
