import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { User, UserAttribute } from "domain/entities/User";
import { MigrationResult } from "domain/entities/UserMigrateStatus";

export interface UserRepository {
    getByIds(ids: Id[]): Async<User[]>;
    getByUsernames(usernames: string[]): Async<User[]>;
    saveAll(users: User[], from: UserAttribute, to: UserAttribute): Async<MigrationResult>;
    getAll(): Async<User[]>;
}
