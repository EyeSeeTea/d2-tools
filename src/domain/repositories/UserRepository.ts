import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { User } from "domain/entities/User";

export interface UserRepository {
    getByIds(ids: Id[]): Async<User[]>;
    getByUsernames(usernames: string[]): Async<User[]>;
    getByUserName(username: string): Async<User | undefined>;
    updateUserName(oldUserName: string, newUserName: string): Async<string>;
}
