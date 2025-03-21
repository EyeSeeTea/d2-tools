import _ from "lodash";
import { D2Api } from "types/d2-api";
import { Async } from "domain/entities/Async";
import { UserRole } from "domain/entities/user-monitoring/authorities-monitoring/UserRole";
import { UserRolesRepository } from "domain/repositories/user-monitoring/authorities-monitoring/UserRolesRepository";

export class UserRolesD2Repository implements UserRolesRepository {
    constructor(private api: D2Api) {}

    async getByAuthorities(authorities: string[]): Async<UserRole[]> {
        const { userRoles: UserRole } = await this.api.metadata
            .get({
                userRoles: {
                    fields: { id: true, authorities: true, name: true, users: { id: true, username: true } },
                    filter: { authorities: { in: authorities } },
                },
            })
            .getData();

        return UserRole;
    }
}
