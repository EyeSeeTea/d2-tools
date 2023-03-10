import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Email, UsernameEmail } from "domain/entities/Notification";

export interface RecipientRepository {
    getByIds(ids: Id[]): Async<Email[]>;
    getByUsernames(usernames: string[]): Async<UsernameEmail[]>;
}
