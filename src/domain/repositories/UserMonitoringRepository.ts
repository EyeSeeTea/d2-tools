import { Async } from "domain/entities/Async";
import { Id, User } from "domain/entities/UserMonitoring";

export interface UserMonitoringRepository {
    getByIds(ids: Id[]): Async<User[]>;
    getAllUsers(excludedUsers: string[], exclude?: boolean): Promise<Async<User[]>>;
    getUsersByGroupId(groupIds: string[]): Promise<Async<User[]>>;
    saveUsers(user: User[]): Promise<string>;
}
