import { D2UserGroup } from "@eyeseetea/d2-api/2.36";
import { Id, NamedRef, Ref } from "domain/entities/Base";
export interface Sharing {
    owner: Id;
    public: string;
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
    access: string;
    displayName: string;
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
