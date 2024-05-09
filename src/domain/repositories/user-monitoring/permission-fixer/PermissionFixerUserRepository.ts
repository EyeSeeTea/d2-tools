import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { PermissionFixerUser } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUser";

export interface PermissionFixerUserRepository {
    getByIds(ids: Id[]): Async<PermissionFixerUser[]>;
    getAllUsers(excludedUsers: string[], exclude?: boolean): Promise<Async<PermissionFixerUser[]>>;
    saveUsers(user: PermissionFixerUser[]): Promise<string>;
}
