import { Async } from "domain/entities/Async";
import { UserRole } from "domain/entities/user-monitoring/user-roles-authorities-monitoring/UserRole";

export interface UserRolesAuthoritiesRepository {
    getAll(): Async<UserRole[]>;
}
