import { Async } from "domain/entities/Async";
import { UserRole } from "domain/entities/user-monitoring/UserRole";

export interface UserRolesRepository {
    getByAuthorities(authority: string[]): Async<UserRole[]>;
}
