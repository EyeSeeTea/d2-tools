import { Id } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { UserGroup } from "domain/entities/user-monitoring/user-group-monitoring/UserGroups";
import { UserGroupRepository } from "domain/repositories/user-monitoring/user-group-monitoring/UserGroupRepository";
import { D2Api } from "@eyeseetea/d2-api/2.36";

export class UserGroupD2Repository implements UserGroupRepository {
    constructor(private api: D2Api) {}

    async get(ids: Id[]): Async<UserGroup[]> {
        const { userGroups } = await this.api.metadata
            .get({
                userGroups: {
                    fields: { $all: true, users: { id: true, name: true } },
                    filter: { id: { in: ids } },
                },
            })
            .getData();

        return userGroups as UserGroup[];
    }
}
