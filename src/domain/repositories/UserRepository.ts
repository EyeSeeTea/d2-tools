import { Async } from "domain/entities/Async";
import { Id, Identifiable } from "domain/entities/Base";
import { User } from "domain/entities/User";
import { Stats } from "domain/entities/Stats";

export interface UserRepository {
    getByIds(ids: Id[]): Async<User[]>;
    getByUsernames(usernames: string[]): Async<User[]>;
    saveAll(users: User[]): Async<Stats>;
    getAll(): Async<User[]>;
    getFromGroupByIdentifiables(values: Identifiable[]): Async<User[]>;
    getByIdentifiables(values: Id[]): Async<User[]>;
}
