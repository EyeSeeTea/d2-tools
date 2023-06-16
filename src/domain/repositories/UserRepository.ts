import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { User } from "domain/entities/User";
import { Stats } from "domain/entities/UserMigrateStatus";

export interface UserRepository {
    getByIds(ids: Id[]): Async<User[]>;
    getByUsernames(usernames: string[]): Async<User[]>;
    saveAll(users: User[]): Async<Stats>;
    getAll(): Async<User[]>;
}
