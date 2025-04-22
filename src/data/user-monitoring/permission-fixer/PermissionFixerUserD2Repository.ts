import { D2Api } from "types/d2-api";
import log from "utils/log";
import _ from "lodash";

import { Id } from "domain/entities/Base";
import { PermissionFixerUserRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerUserRepository";
import { PermissionFixerUser } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUser";
import { Async } from "domain/entities/Async";

export class PermissionFixerUserD2Repository implements PermissionFixerUserRepository {
    constructor(private api: D2Api) {}

    async getByIds(ids: Id[]): Async<PermissionFixerUser[]> {
        log.info(`Get metadata: Users by ids: ${ids.join(",")}`);
        //todo use d2api filters
        const responses = await this.api
            .get<Users>(
                `/users.json?paging=false&fields=*,userCredentials[*]&filter=id:in:[${ids.join(",")}]`
            )
            .getData();

        return responses["users"];
    }

    async getAllUsers(): Async<PermissionFixerUser[]> {
        log.info(`Get metadata: All users`);
        //todo use d2api filters
        const responses = await this.api
            .get<Users>(`/users.json?paging=false&fields=*,userCredentials[*]`)
            .getData();

        return responses["users"];
    }

    async saveUsers(users: PermissionFixerUser[]): Async<string> {
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
type Users = { users: PermissionFixerUser[] };
type UserResponse = { status: string; typeReports: object[] };
