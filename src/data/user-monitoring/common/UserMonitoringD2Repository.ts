import { D2Api } from "types/d2-api";
import log from "utils/log";
import _ from "lodash";
import { UserMonitoringRepository } from "domain/repositories/user-monitoring/common/UserMonitoringRepository";
import { Async } from "domain/entities/Async";
import { UserMonitoringUser } from "domain/entities/user-monitoring/common/UserMonitoringUser";
import { Id } from "domain/entities/Base";

export class UserMonitoringD2Repository implements UserMonitoringRepository {
    constructor(private api: D2Api) {}
    async getUsersByGroupId(groupIds: string[]): Promise<Async<UserMonitoringUser[]>> {
        log.info(`Get users by group: Users by ids: ${groupIds.join(",")}`);
        const responses = await this.api
            .get<Users>(
                `/users.json?paging=false&fields=*,userCredentials[*]&filter=userGroups.id:in:[${groupIds.join(
                    ","
                )}]`
            )
            .getData();
        return responses["users"];
    }

    async getByIds(ids: Id[]): Async<UserMonitoringUser[]> {
        log.info(`Get metadata: Users by ids: ${ids.join(",")}`);
        const responses = await this.api
            .get<Users>(
                `/users.json?paging=false&fields=*,userCredentials[*]&filter=id:in:[${ids.join(",")}]`
            )
            .getData();

        return responses["users"];
    }

    async getAllUsers(excludedUsers: string[], exclude?: boolean): Promise<Async<UserMonitoringUser[]>> {
        log.info(`Get metadata: All users except: ${excludedUsers.join(",")}`);
        const filterOption = exclude ? "!in" : "in";
        const responses = await this.api
            .get<Users>(
                `/users.json?paging=false&fields=*,userCredentials[*]&filter=id:${filterOption}:[${excludedUsers.join(
                    ","
                )}]`
            )
            .getData();

        return responses["users"];
    }

    async saveUsers(users: UserMonitoringUser[]): Promise<string> {
        log.info("Push users to dhis2");

        const usersReadyToPost: Users = { users: users };

        const response: UserResponse = await this.api
            .post<UserResponse>("/metadata", { async: false }, usersReadyToPost)
            .getData()
            .catch(err => {
                if (err?.response?.data) {
                    return err.response.data as UserResponse;
                } else {
                    return { status: "ERROR", typeReports: [] };
                }
            });
        return response.status;
    }
}
type Users = { users: UserMonitoringUser[] };
type UserResponse = { status: string; typeReports: object[] };
