import { Username } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { User } from "domain/entities/user-monitoring/user-templates-monitoring/Users";

export interface UserRepository {
    getByUsername(usernames: Username[]): Async<User[]>;
}
