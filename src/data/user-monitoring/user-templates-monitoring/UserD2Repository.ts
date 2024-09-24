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
            // used to avoid repeating userRoles in userCredentials
            const { userRoles, ...userCredentials } = user.userCredentials;

            return {
                ...user,
                username: userCredentials.username,
                disabled: userCredentials.disabled,
                twoFA: userCredentials.twoFA,
                userRoles: userRoles,
                invitation: userCredentials.invitation,
                externalAuth: userCredentials.externalAuth,
                selfRegistered: userCredentials.selfRegistered,
                catDimensionConstraints: userCredentials.catDimensionConstraints,
                cogsDimensionConstraints: userCredentials.cogsDimensionConstraints,
                attributeValues: user.attributeValues.map(attributeValue => ({
                    attribute: attributeValue.attribute.name,
                    value: attributeValue.value,
                })),
                userCredentials: userCredentials,
            };
        });
    }
}

const userFields = {
    id: true,
    code: true,
    lastUpdated: true,
    created: true,
    invitation: true,
    firstName: true,
    name: true,
    favorite: true,
    displayName: true,
    externalAccess: true,
    surname: true,
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
        id: true,
        code: true,
        twoFA: true,
        // NOTE: twoFA changes to twoFactorEnabled in 2.4x
        // twoFactorEnabled: true,
        access: true,
        ldapId: true,
        openId: true,
        sharing: true,
        username: true,
        disabled: true,
        invitation: true,
        externalAuth: true,
        selfRegistered: true,
        catDimensionConstraints: true,
        cogsDimensionConstraints: true,
        userRoles: { id: true, name: true },
    },
} as const;
