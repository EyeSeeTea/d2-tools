import { D2Api } from "@eyeseetea/d2-api/2.36";

import { Id } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { UserGroup } from "domain/entities/user-monitoring/user-groups-monitoring/UserGroups";
import { UserGroupRepository } from "domain/repositories/user-monitoring/user-groups-monitoring/UserGroupRepository";

export class UserGroupD2Repository implements UserGroupRepository {
    constructor(private api: D2Api) {}

    async get(ids: Id[]): Async<UserGroup[]> {
        const { userGroups } = await this.api.metadata
            .get({
                userGroups: {
                    fields: userFields,
                    filter: { id: { in: ids } },
                },
            })
            .getData();

        return userGroups.map((userGroup): UserGroup => {
            return {
                ...userGroup,
                attributeValues: userGroup.attributeValues.map(attributeValue => ({
                    attribute: attributeValue.attribute.name,
                    value: attributeValue.value,
                })),
            };
        });
    }
}

const userFields = {
    id: true,
    code: true,
    name: true,
    access: true,
    created: true,
    favorite: true,
    favorites: true,
    lastUpdated: true,
    displayName: true,
    translations: true,
    publicAccess: true,
    externalAccess: true,
    managedGroups: { id: true, name: true },
    managedByGroups: { id: true, name: true },
    sharing: { userGroups: true, external: true, users: true, owner: true, public: true },
    attributeValues: { attribute: { name: true }, value: true },
    user: { id: true, name: true, username: true, displayName: true },
    createdBy: { id: true, name: true, username: true, displayName: true },
    lastUpdatedBy: { id: true, name: true, username: true, displayName: true },
    userAccesses: { id: true, access: true, displayName: true, userUid: true },
    userGroupAccesses: { id: true, access: true, displayName: true, userUid: true },
    users: { id: true, name: true },
} as const;
