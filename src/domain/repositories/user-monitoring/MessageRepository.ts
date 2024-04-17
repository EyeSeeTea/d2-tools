import { Async } from "domain/entities/Async";

export interface MessageRepository {
    sendMessage(message: string): Async<void>;
}
