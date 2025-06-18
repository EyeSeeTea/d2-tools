import { D2Api } from "types/d2-api";
import log from "utils/log";
import _ from "lodash";
import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";
import { TwoFactorUserRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorUserRepository";
import { PermissionFixerUser } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUser";
import { Async } from "domain/entities/Async";

export class TwoFactorUserD2Repository implements TwoFactorUserRepository {
    constructor(private api: D2Api) {}

    async getUsersNotInGroupIds(excludeUserGroupIds:string[]): Async<TwoFactorUser[]> {
        log.info(`Get users not in group: ${excludeUserGroupIds.join(",")}`);
        //todo use d2api filters
        //We need to check if the program metadata is valid due !in filter is not working propertly in dhis2 2.41
        const responses = await this.api
            .get<Users>(
                `/users.json?paging=false&fields=id,username,disabled,externalAuth,userGroups,created,userCredentials[twoFa,twoFactorEnabled]&filter=userGroups.id:!in:[${excludeUserGroupIds.join(
                    ","
                )}]`
            )
            .getData();
        return responses["users"].map(user => {
            const twoFA = user.userCredentials.twoFA || user.userCredentials.twoFactorEnabled;
            return {
                id: user.id,
                username: user.username,
                twoFA: twoFA ?? false,
                disabled: user.disabled ?? false,
                externalAuth: user.externalAuth ?? false,
                userGroups: user.userGroups ?? [],
            };
        });
    }

    async disableUsers(userIds: string[]):Async<string>{
        log.info(`Disabling users by ids: ${userIds.join(",")}`);

        const results = await Promise.all(
            userIds.map(async userId => {
                try {
                    const response = await this.api
                        .request<string>({
                            method: "patch",
                            url: `/41/users/${userId}`,
                            headers: { "Content-Type": "application/json-patch+json" },
                            data: [{ op: "replace", path: "/disabled", value: true }],
                        })
                        .getData();

                    return { userId, status: "success", response };
                } catch (error) {
                    log.error(`Error disabling user ${userId}:` + error);
                    return { userId, status: "error", error };
                }
            })
        );
        return JSON.stringify(results);
    }
}

type Users = { users: PermissionFixerUser[] };
