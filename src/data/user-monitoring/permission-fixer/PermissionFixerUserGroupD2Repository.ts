import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import log from "utils/log";
import { PermissionFixerUserGroupExtended } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserGroupExtended";
import { PermissionFixerUserGroupRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerUserGroupRepository";
import { Async } from "domain/entities/Async";
import { UserGroupNotFoundException } from "./exception/UserGroupNotFoundException";
import { Ref } from "domain/entities/Base";
import { Stats } from "domain/entities/Stats";
import { Method } from "@eyeseetea/d2-api/repositories/HttpClientRepository";

export class PermissionFixerUserGroupD2Repository implements PermissionFixerUserGroupRepository {
    constructor(private api: D2Api) {}
    async get(groupsIds: string): Async<PermissionFixerUserGroupExtended> {
        log.info(`Get metadata: All groups`);

        //todo use d2api filters
        const userGroup = await this.api
            .get<PermissionFixerUserGroupExtended>(`/userGroups/${groupsIds}.json?fields=id,name,users`)
            .getData();

        if (userGroup) {
            return userGroup;
        } else {
            log.info(`Error getting user group: ${groupsIds}`);

            throw new UserGroupNotFoundException("Error getting user group: " + groupsIds);
        }
    }
    async save(userGroup: PermissionFixerUserGroupExtended, _users: Ref[]): Async<string> {
        try {
            const patchOps = _users.map(userId => ({
                op: "add",
                path: "/users/-",
                value: { id: userId.id },
            }));

            const response = await this.api
                .request<string>({
                    method: "patch" as Method,
                    url: `/41/userGroups/${userGroup.id}`,
                    headers: {
                        "Content-Type": "application/json-patch+json",
                    },
                    data: patchOps,
                })
                .getData();

            log.info(`Users [${_users.join(", ")}] added to group ${userGroup.name} (${userGroup.id})`);

            log.info(JSON.stringify(response));
            return "SUCCESS";
        } catch (error) {
            log.error("Error adding users to group");
            console.debug(error);
            return "ERROR";
        }
    }

    private async appendUsersToUsergroup(
        userGroup: PermissionFixerUserGroupExtended,
        users: Ref[]
    ): Async<string> {
        const usersIds = users.map(({ id }) => ({ id: id }));
        const response = await this.api
            .post<UserGroupResponse>(
                `/userGroups/${userGroup.id}/users/`,
                {},
                {
                    additions: usersIds,
                }
            )
            .getData();
        log.info(response.status);
        return response.status;
    }
}

type UserGroupResponse = {
    status: string;
    typeReports: object[];
    stats: Stats;
};
