import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

import { NotificationsRepository } from "domain/repositories/NotificationsRepository";
import { Notification } from "domain/entities/Notification";

export class NotificationsEmailRepository implements NotificationsRepository {
    async send(notification: Notification): Promise<void> {
        const transport = nodemailer.createTransport({
            host: "localhost",
            port: 25,
            tls: { rejectUnauthorized: false },
        });

        await transport.sendMail({
            to: notification.recipients,
            subject: notification.subject,
            text: notification.body,
            attachments: notification.attachments.map(attachment => {
                const filename = path.basename(attachment.file);
                const content = fs.readFileSync(filename, "utf8");
                return { filename, content };
            }),
        });
    }
}
