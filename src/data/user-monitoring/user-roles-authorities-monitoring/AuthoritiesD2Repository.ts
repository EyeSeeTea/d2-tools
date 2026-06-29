import { D2Api } from "types/d2-api";
import { Async } from "domain/entities/Async";

import { Authority } from "domain/entities/user-monitoring/user-roles-authorities-monitoring/Authority";
import { AuthoritiesRepository } from "domain/repositories/user-monitoring/user-roles-authorities-monitoring/AuthoritiesRepository";

export class AuthoritiesD2Repository implements AuthoritiesRepository {
    constructor(private api: D2Api) {}

    async getAll(): Async<Authority[]> {
        const authorities = await this.api
            .get<AuthoritiesResponse>("authorities", {
                fields: "id,name",
                paging: false,
            })
            .getData();

        return authorities.systemAuthorities;
    }
}

interface AuthoritiesResponse {
    systemAuthorities: Authority[];
}
