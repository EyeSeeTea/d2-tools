import { Id } from "./Base";

export interface SmsOutbound {
    id: Id;
    status: string;
    recipients: string[];
    message: string;
    date: string;
}
