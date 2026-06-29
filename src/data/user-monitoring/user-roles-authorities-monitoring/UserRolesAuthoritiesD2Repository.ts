import { D2Api } from "types/d2-api";
import { Async } from "domain/entities/Async";
import { UserRole } from "domain/entities/user-monitoring/user-roles-authorities-monitoring/UserRole";
import { UserRolesAuthoritiesRepository } from "domain/repositories/user-monitoring/user-roles-authorities-monitoring/UserRolesAuthoritiesRepository";

export class UserRolesAuthoritiesD2Repository implements UserRolesAuthoritiesRepository {
    constructor(private api: D2Api) {}

    async getAll(): Async<UserRole[]> {
        const response = await this.api.models.userRoles
            .get({
                fields: { id: true, authorities: true, name: true },
                paging: false,
            })
            .getData();

        return response.objects.map((userRole): UserRole => {
            return {
                id: userRole.id,
                name: userRole.name,
                authorities: userRole.authorities,
            };
        });
    }
}
