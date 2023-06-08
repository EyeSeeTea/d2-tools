import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { User, UserMigrate } from "domain/entities/User";
import { MigrationResult } from "domain/entities/UserMigrateStatus";

export interface UserRepository {
    getByIds(ids: Id[]): Async<User[]>;
    getByUsernames(usernames: string[]): Async<User[]>;
    updateUserName(
        oldUserName: string,
        newUserName: string,
        usersToUpdate: UserMigrate[]
    ): Async<MigrationResult>;
    getAll(): Async<UserMigrate[]>;
}
