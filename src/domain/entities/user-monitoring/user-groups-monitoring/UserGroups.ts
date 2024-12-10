import { Id, NamedRef, Ref } from "domain/entities/Base";

import { UserReference } from "domain/entities/UserReference";
import { AttributeValue } from "domain/entities/AttributeValue";
import { Access, AccessString, UserAccess, UserGroupAccess } from "domain/entities/Access";
import { Translation } from "domain/entities/Translation";

export type UserGroup = {
    id: Id;
    name: string;
    access: Access;
    attributeValues: AttributeValue[];
    created: string;
    createdBy: UserReference;
    displayName: string;
    externalAccess?: boolean;
    favorite: boolean;
    favorites: string[];
    lastUpdated: string;
    lastUpdatedBy: UserReference;
    managedByGroups: Ref[];
    managedGroups: Ref[];
    sharing: Sharing;
    user: UserReference;
    users: NamedRef[];
    translations: Translation[];
    code?: Id;
    publicAccess?: AccessString;
    userAccesses?: UserAccess[];
    userGroupAccesses?: UserGroupAccess[];
};

type Sharing = {
    owner: Id;
    public: string;
    external: boolean;
    users: Record<Id, SharingUser>;
    userGroups: Record<Id, SharingUser>;
};

type SharingUser = {
    id: Id;
    access: string;
    displayName?: string;
};

export type UserGroupDiff = {
    id: Id;
    name: string;
    newProps: Partial<UserGroup>;
    changedPropsLost: Partial<UserGroup>;
    changedPropsAdded: Partial<UserGroup>;
    usersChanges: {
        usersLost: NamedRef[];
        usersAdded: NamedRef[];
    };
};
