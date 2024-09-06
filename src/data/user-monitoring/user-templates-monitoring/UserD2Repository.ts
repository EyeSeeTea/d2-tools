import { Username } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { User } from "domain/entities/user-monitoring/user-templates-monitoring/Users";
import { UserRepository } from "domain/repositories/user-monitoring/user-templates-monitoring/UserRepository";
import { D2Api, SelectedPick, D2UserSchema } from "@eyeseetea/d2-api/2.36";

export class UserD2Repository implements UserRepository {
    constructor(private api: D2Api) {}

    async getByUsername(usernames: Username[]): Async<User[]> {
        const users = await this.api.models.users
            .get({
                fields: userFields,
                filter: { username: { in: usernames } },
                paging: false,
            })
            .getData();

        return users.objects.map((user: D2User) => {
            return {
                ...user,
                id: user.id,
                username: user.username,
                userCredentials: {
                    ...user.userCredentials,
                },
            } as User;
        });
    }
}

const userFields = {
    $all: true,
    username: true,
    userRoles: { id: true, name: true },
    userGroups: { id: true, name: true },
    userCredentials: {
        access: true,
        accountExpiry: true,
        attributeValues: true,
        catDimensionConstraints: true,
        code: true,
        cogsDimensionConstraints: true,
        created: true,
        createdBy: true,
        disabled: true,
        displayName: true,
        externalAccess: true,
        externalAuth: true,
        favorite: true,
        favorites: true,
        href: true,
        id: true,
        invitation: true,
        lastLogin: true,
        lastUpdated: true,
        lastUpdatedBy: true,
        ldapId: true,
        name: true,
        openId: true,
        password: true,
        passwordLastUpdated: true,
        publicAccess: true,
        selfRegistered: true,
        sharing: true,
        translations: true,
        twoFA: true,
        user: true,
        userAccesses: true,
        userGroupAccesses: true,
        userInfo: true,
        username: true,
        userRoles: false,
    },
} as const;

type D2User = {
    username?: string;
} & Partial<SelectedPick<D2UserSchema, typeof userFields>>;
