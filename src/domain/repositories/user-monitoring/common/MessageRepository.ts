import { Async } from "domain/entities/Async";

export interface MessageRepository {
    sendMessage(messageType: string, message: string): Async<boolean>;
}
