import { UserGroupRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/UserGroupRepository";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import log from "utils/log";
import { UserGroupExtended } from "domain/entities/user-monitoring/common/UserGroupExtended";

export class UserGroupD2Repository implements UserGroupRepository {
    constructor(private api: D2Api) {}
    async getByIds(groupsIds: string[]): Promise<UserGroupExtended[]> {
        log.info(`Get metadata: All groups`);

        const responses = await this.api
            .get<UserGroups>(
                `/userGroups?filter=id:in:[${groupsIds.join(
                    ","
                )}]&fields=id,created,lastUpdated,name,users,*&paging=false.json`
            )
            .getData();

        return responses["userGroups"];
    }
    async save(userGroup: UserGroupExtended): Promise<string> {
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

type UserGroups = { userGroups: UserGroupExtended[] };
