import { Path } from "./Base";

export interface Notification {
    recipients: string[];
    subject: string;
    body: string;
    attachments: Attachment[];
}

export type Attachment = { type: "file"; file: Path };
