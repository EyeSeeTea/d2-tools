import { Async } from "domain/entities/Async";
import { Id, User } from "domain/entities/user-monitoring/UserMonitoring";

export interface UserRepository {
    getByIds(ids: Id[]): Async<User[]>;
    getAllUsers(excludedUsers: string[], exclude?: boolean): Promise<Async<User[]>>;
    getUsersByGroupId(groupIds: string[]): Promise<Async<User[]>>;
    saveUsers(user: User[]): Promise<string>;
}
