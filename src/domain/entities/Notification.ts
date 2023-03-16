import { Id, Path } from "./Base";

export interface Notification {
    recipients: Recipient[];
    subject: string;
    body: string;
    attachments: Attachment[];
}

export type Recipient = Email | Id;
export type Email = string;

export type Attachment = { type: "file"; file: Path };
