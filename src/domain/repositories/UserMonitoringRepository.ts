import { Async } from "domain/entities/Async";
import { User } from "domain/entities/UserMonitoring";

export interface UserMonitoringRepository {
    getAllUsers(excludedUsers: string[], exclude?: boolean): Promise<Async<User[]>>;
    saveUsers(user: User[]): Promise<string>;
}
