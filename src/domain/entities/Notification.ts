import { Id, Path } from "./Base";

export interface Notification {
    recipients: Recipient[];
    subject: string;
    body: { type: "text"; contents: string } | { type: "html"; contents: string };
    attachments: Attachment[];
}

export type Recipient = Email | Id;
export type Email = string;

export type Attachment = { type: "file"; path: Path };
