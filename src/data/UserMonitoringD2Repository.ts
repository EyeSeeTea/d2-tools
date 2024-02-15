import { D2Api } from "types/d2-api";
import log from "utils/log";
import { IdItem, User, UserGroup, UserRes } from "./d2-users/D2Users.types";
import { getUid } from "utils/uid";
import _ from "lodash";
import { UserMonitoringRepository } from "domain/repositories/UserMonitoringRepository";
import { Async } from "domain/entities/Async";

export class UserMonitoringD2Repository implements UserMonitoringRepository {
    constructor(private api: D2Api) {}

    async getAllUsers(excludedUsers: string[], exclude?: boolean): Promise<Async<User[]>> {
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

    async saveUsers(users: User[]): Promise<string> {
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
type Users = { users: User[] };
type UserResponse = { status: string; typeReports: object[] };
