import { D2Api, Stats } from "@eyeseetea/d2-api/2.36";
import log from "utils/log";
import { PermissionFixerUserGroupExtended } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserGroupExtended";
import { PermissionFixerUserGroupRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerUserGroupRepository";
import { Async } from "domain/entities/Async";
import { UserGroupNotFoundException } from "./exception/UserGroupNotFoundException";
import { Ref } from "domain/entities/Base";

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
    async save(userGroup: PermissionFixerUserGroupExtended, users: Ref[]): Async<string> {
        try {
            const response = await this.appendUsersToUsergroup(userGroup, users);
            if (response == "OK") {
                log.info("Users added to minimal group");
            } else {
                log.error("Error adding users to minimal group");
            }

            log.info(JSON.stringify(response));

            return response;
        } catch (error) {
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
