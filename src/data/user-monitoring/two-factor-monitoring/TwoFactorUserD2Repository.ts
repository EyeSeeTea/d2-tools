import { D2Api } from "types/d2-api";
import log from "utils/log";
import _ from "lodash";
import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";
import { TwoFactorUserRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorUserRepository";
import { PermissionFixerUser } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUser";
import { Async } from "domain/entities/Async";

export class TwoFactorUserD2Repository implements TwoFactorUserRepository {
    constructor(private api: D2Api) {}
    async getUsersByGroupId(groupIds: string[]): Async<TwoFactorUser[]> {
        log.info(`Get users by group: Users by ids: ${groupIds.join(",")}`);
        //todo use d2api filters
        const responses = await this.api
            .get<Users>(
                `/users.json?paging=false&fields=*,userCredentials[*]&filter=userGroups.id:in:[${groupIds.join(
                    ","
                )}]`
            )
            .getData();
        return responses["users"].map(user => {
            return {
                id: user.id,
                username: user.username,
                twoFA: user.twoFA,
            };
        });
    }
}
type Users = { users: PermissionFixerUser[] };
