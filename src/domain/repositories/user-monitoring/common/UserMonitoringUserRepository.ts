import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { UserMonitoringUser } from "domain/entities/user-monitoring/common/UserMonitoringUser";

export interface UserMonitoringUserRepository {
    getByIds(ids: Id[]): Async<UserMonitoringUser[]>;
    getAllUsers(excludedUsers: string[], exclude?: boolean): Promise<Async<UserMonitoringUser[]>>;
    getUsersByGroupId(groupIds: string[]): Promise<Async<UserMonitoringUser[]>>;
    saveUsers(user: UserMonitoringUser[]): Promise<string>;
}
