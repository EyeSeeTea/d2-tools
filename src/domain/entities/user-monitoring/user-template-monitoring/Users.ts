import { D2User, D2UserCredentials } from "@eyeseetea/d2-api/2.36";
import { Id, Username, NamedRef } from "domain/entities/Base";

type UserCredentials = Partial<Omit<D2UserCredentials, "userRoles">>;

export type User = {
    id: Id;
    username: Username;
    userCredentials?: UserCredentials;
} & Partial<D2User>;

type MembershipChanges = {
    userRoles_Lost: NamedRef[];
    userRoles_Added: NamedRef[];
    userGroups_Lost: NamedRef[];
    userGroups_Added: NamedRef[];
};

export type UserTemplateDiff = {
    id: Id;
    username: Username;
    newProps: Partial<User>;
    changedPropsLost: Partial<User>;
    changedPropsAdded: Partial<User>;
    membershipChanges: MembershipChanges;
};
