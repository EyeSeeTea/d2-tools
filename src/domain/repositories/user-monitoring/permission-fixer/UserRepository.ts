import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { User } from "domain/entities/user-monitoring/common/User";

export interface UserRepository {
    getByIds(ids: Id[]): Async<User[]>;
    getAllUsers(excludedUsers: string[], exclude?: boolean): Promise<Async<User[]>>;
    getUsersByGroupId(groupIds: string[]): Promise<Async<User[]>>;
    saveUsers(user: User[]): Promise<string>;
}
