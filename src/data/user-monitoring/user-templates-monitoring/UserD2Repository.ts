import { Username } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { User } from "domain/entities/user-monitoring/user-templates-monitoring/Users";
import { UserRepository } from "domain/repositories/user-monitoring/user-templates-monitoring/UserRepository";
import { D2Api } from "@eyeseetea/d2-api/2.36";

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

        return users.objects.map((user): User => {
            return {
                ...user,
                username: user.userCredentials.username,
                disabled: user.userCredentials.disabled,
                twoFA: user.userCredentials.twoFA,
                userRoles: user.userCredentials.userRoles,
                invitation: user.userCredentials.invitation,
                externalAuth: user.userCredentials.externalAuth,
                selfRegistered: user.userCredentials.selfRegistered,
                catDimensionConstraints: user.userCredentials.catDimensionConstraints,
                cogsDimensionConstraints: user.userCredentials.cogsDimensionConstraints,
                attributeValues: user.attributeValues.map(attributeValue => ({
                    attribute: attributeValue.attribute.name,
                    value: attributeValue.value,
                })),
                userCredentials: {
                    externalAuth: user.userCredentials.externalAuth,
                    disabled: user.userCredentials.disabled,
                    id: user.userCredentials.id,
                    twoFA: user.userCredentials.twoFA,
                    invitation: user.userCredentials.invitation,
                    selfRegistered: user.userCredentials.selfRegistered,
                    username: user.userCredentials.username,
                    access: user.userCredentials.access,
                    sharing: user.userCredentials.sharing,
                    cogsDimensionConstraints: user.userCredentials.cogsDimensionConstraints,
                    catDimensionConstraints: user.userCredentials.catDimensionConstraints,
                },
            };
        });
    }
}

const userFields = {
    id: true,
    lastUpdated: true,
    created: true,
    invitation: true,
    selfRegistered: true,
    firstName: true,
    name: true,
    favorite: true,
    displayName: true,
    externalAuth: true,
    externalAccess: true,
    surname: true,
    disabled: true,
    sharing: true,
    access: true,
    translations: true,
    favorites: true,
    organisationUnits: { id: true },
    userGroups: { id: true, name: true },
    dataViewOrganisationUnits: { id: true },
    teiSearchOrganisationUnits: { id: true },
    attributeValues: { attribute: { name: true }, value: true },
    user: { id: true, name: true, username: true, displayName: true },
    createdBy: { id: true, name: true, username: true, displayName: true },
    lastUpdatedBy: { id: true, name: true, username: true, displayName: true },
    userAccesses: { id: true, access: true, displayName: true, userUid: true },
    userGroupAccesses: { id: true, access: true, displayName: true, userUid: true },
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
        userRoles: { id: true, name: true },
    },
} as const;
