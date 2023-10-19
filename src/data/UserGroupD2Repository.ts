import { D2Api, MetadataPick } from "types/d2-api";
import { Async } from "domain/entities/Async";
import { UserGroup } from "domain/entities/UserGroup";
import { UserGroupParams, UserGroupRepository } from "domain/repositories/UserGroupRepository";

export class UserGroupD2Repository implements UserGroupRepository {
    constructor(private api: D2Api) {}

    getAll(): Async<UserGroup[]> {
        return this.getUserGroups({ page: 1 }, []);
    }

    private async getUserGroups(params: UserGroupParams, acum: UserGroup[]): Async<UserGroup[]> {
        const d2Response = await this.getPaginatedUserGroups(params);
        const newRecords = [...acum, ...this.buildUserGroup(d2Response.data.objects)];
        if (d2Response.data.pager.page >= d2Response.data.pager.pageCount) {
            return newRecords;
        } else {
            return this.getUserGroups({ ...params, page: params.page + 1 }, newRecords);
        }
    }

    private buildUserGroup(result: D2UserGroup[]) {
        return result.map((d2UserGroup): UserGroup => {
            return {
                id: d2UserGroup.id,
                name: d2UserGroup.name,
            };
        });
    }

    private async getPaginatedUserGroups(params: UserGroupParams) {
        const response = await this.api.models.userGroups
            .get({
                fields: userGroupFields,
                page: params.page,
                pageSize: 300,
            })
            .response();
        return response;
    }
}

const userGroupFields = {
    id: true,
    name: true,
} as const;

type D2UserGroup = MetadataPick<{
    userGroups: { fields: typeof userGroupFields };
}>["userGroups"][number];
