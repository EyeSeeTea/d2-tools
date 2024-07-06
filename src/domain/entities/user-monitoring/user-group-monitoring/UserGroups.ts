import { D2UserGroup } from "@eyeseetea/d2-api/2.36";
import { Access, Id, NamedRef, Ref } from "domain/entities/Base";
import { U } from "vitest/dist/types-198fd1d9";

// export declare type D2UserGroup = {
//     access: D2Access;
//     attributeValues: D2AttributeValue[];
//     code: Id;
//     created: string;
//     createdBy: D2User;
//     displayName: string;
//     externalAccess: boolean;
//     favorite: boolean;
//     favorites: string[];
//     href: string;
//     id: Id;
//     lastUpdated: string;
//     lastUpdatedBy: D2User;
//     managedByGroups: D2UserGroup[];
//     managedGroups: D2UserGroup[];
//     name: string;
//     publicAccess: string;
//     sharing: Sharing;
//     translations: D2Translation[];
//     user: D2User;
//     userAccesses: D2UserAccess[];
//     userGroupAccesses: D2UserGroupAccess[];
//     users: D2User[];
// };
// export declare type D2UserGroupAccess = {
//     access: string;
//     displayName: string;
//     id: string;
//     userGroupUid: string;
// };

// declare type Access = string;
// interface IdAccess {
//     id: Id;
//     access: Access;
// }
export interface Sharing {
    owner: Id;
    public: Access;
    external: boolean;
    users: Record<Id, SharingUser>;
    userGroups: Record<Id, SharingUser>;
}

export type UserGroup = Pick<D2UserGroup, "id" | "name"> &
    Partial<
        Omit<
            D2UserGroup,
            "users" | "lastUpdatedBy" | "managedByGroups" | "sharing" | "createdBy" | "user"
        > & {
            created: string;
            lastUpdatedBy: UserDetails;
            managedByGroups: Ref[];
            users: NamedRef[];
            sharing: Sharing;
            createdBy: UserDetails;
            user: UserDetails;
        }
    >;

export type UserDetails = NamedRef & {
    username: string;
    displayName: string;
};

export type SharingUser = {
    id: Id;
    access: Access;
    displayName: string;
};

export type UserGroupDiff = {
    id: Id;
    name: string;
    newProps: Partial<UserGroup>;
    changedPropsLost: Partial<UserGroup>;
    changedPropsAdded: Partial<UserGroup>;
    usersChanges: {
        users_Lost: NamedRef[];
        users_Added: NamedRef[];
    };
};
