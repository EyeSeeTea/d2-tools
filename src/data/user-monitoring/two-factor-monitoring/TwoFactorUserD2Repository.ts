import { D2Api } from "types/d2-api";
import log from "utils/log";
import _ from "lodash";
import { DisableUserResult } from "domain/entities/user-monitoring/two-factor-monitoring/DisableUsersResult";
import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";
import { TwoFactorUserRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorUserRepository";
import { Async } from "domain/entities/Async";
import { Method } from "@eyeseetea/d2-api/repositories/HttpClientRepository";

const DISABLE_USERS_BATCH_SIZE = 50;

export class TwoFactorUserD2Repository implements TwoFactorUserRepository {
    constructor(private api: D2Api) {}

    async getUsersNotInGroupIds(excludeUserGroupIds: string[]): Async<TwoFactorUser[]> {
        log.info(`Get users not in group: ${excludeUserGroupIds.join(",")}`);
        //todo use d2api filters
        //We need to check if the program metadata is valid due !in filter is not working propertly in dhis2 2.41
        const responses = await this.api
            .get<Users>(
                `/users.json?paging=false&fields=id,username,disabled,externalAuth,userGroups,created,twoFa,twoFactorEnabled&filter=userGroups.id:!in:[${excludeUserGroupIds.join(
                    ","
                )}]`
            )
            .getData();

        return responses["users"].map(user => {
            const twoFA = user.twoFA || user.twoFactorEnabled;
            return {
                id: user.id,
                username: user.username,
                twoFA: twoFA ?? false,
                disabled: user.disabled ?? false,
                externalAuth: user.externalAuth ?? false,
                userGroups: user.userGroups ?? [],
                created: user.created,
            };
        });
    }

    async disableUsers(userIds: string[]): Async<DisableUserResult[]> {
        log.info(`Disabling users by ids: ${userIds.join(",")}`);

        const results: DisableUserResult[] = [];

        for (const userIdsBatch of _.chunk(userIds, DISABLE_USERS_BATCH_SIZE)) {
            const batchResults = await Promise.all(
                userIdsBatch.map(async (userId): Promise<DisableUserResult> => {
                    try {
                        const response = await this.api
                            .request<string>({
                                // TEMPORAL. See https://github.com/EyeSeeTea/d2-api/pull/171
                                method: "patch" as Method,
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

            results.push(...batchResults);
        }

        return results;
    }
}

type D2TwoFactorUserResponse = {
    id: string;
    username: string;
    disabled: boolean;
    externalAuth: boolean;
    userGroups: { id: string; name: string }[];
    created?: string;
    twoFA?: boolean;
    twoFactorEnabled?: boolean;
};

type Users = { users: D2TwoFactorUserResponse[] };
