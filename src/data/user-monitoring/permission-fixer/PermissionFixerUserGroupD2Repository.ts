import { D2Api } from "@eyeseetea/d2-api/2.36";
import log from "utils/log";
import { PermissionFixerUserGroupExtended } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserGroupExtended";
import { PermissionFixerUserGroupRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerUserGroupRepository";

export class UserGroupD2Repository implements PermissionFixerUserGroupRepository {
    constructor(private api: D2Api) {}
    async getByIds(groupsIds: string[]): Promise<PermissionFixerUserGroupExtended[]> {
        log.info(`Get metadata: All groups`);

        //todo use d2api filters
        const responses = await this.api
            .get<UserGroups>(
                `/userGroups?filter=id:in:[${groupsIds.join(",")}]&fields=id,name,users,*&paging=false.json`
            )
            .getData();

        return responses["userGroups"];
    }
    async save(userGroup: PermissionFixerUserGroupExtended): Promise<string> {
        try {
            const response = await this.api.models.userGroups.put(userGroup).getData();
            response.status == "OK"
                ? log.info("Users added to minimal group")
                : log.error("Error adding users to minimal group");
            log.info(JSON.stringify(response.response));

            return response.status;
        } catch (error) {
            console.debug(error);
            return "ERROR";
        }
    }
}

type UserGroups = { userGroups: PermissionFixerUserGroupExtended[] };
