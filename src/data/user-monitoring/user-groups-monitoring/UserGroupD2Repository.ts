import { Id } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { UserGroup } from "domain/entities/user-monitoring/user-groups-monitoring/UserGroups";
import { UserGroupRepository } from "domain/repositories/user-monitoring/user-groups-monitoring/UserGroupRepository";
import { D2Api, MetadataPick, D2UserGroupSchema } from "@eyeseetea/d2-api/2.36";

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

        return userGroups.map((userGroup: D2UserGroup) => {
            return {
                ...userGroup,
                id: userGroup.id,
                name: userGroup.name,
            } as UserGroup;
        });
    }
}

const userFields = { $all: true, users: { id: true, name: true } } as const;

type D2UserGroup = {
    id: Id;
    name: string;
} & Partial<MetadataPick<{ userGroups: { fields: typeof userFields } }>["userGroups"][number]>;
