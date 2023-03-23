import nodemailer from "nodemailer";
import path from "path";
import dotenv from "dotenv";

import { NotificationsRepository } from "domain/repositories/NotificationsRepository";
import { Notification } from "domain/entities/Notification";
import log from "utils/log";

interface SMTPConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    tls: boolean;
    sender: string;
}

export class NotificationsEmailRepository implements NotificationsRepository {
    async send(notification: Notification): Promise<void> {
        const config: SMTPConfig = this.getSMTPConfigFromEnv();

        const transport = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            ...(config.tls ? { tls: { rejectUnauthorized: false } } : { secure: false }),
            auth: { user: config.user, pass: config.password },
        });

        const { body } = notification;
        const res = await transport.sendMail({
            to: notification.recipients,
            from: config.sender,
            subject: notification.subject,
            ...(body.type === "html" ? { html: body.contents } : { text: body.contents }),
            attachments: notification.attachments.map(attachment => {
                return {
                    path: attachment.path,
                    filename: path.basename(attachment.path),
                    cid: path.basename(attachment.path),
                };
            }),
        });

        log.info(res.response);
    }

    private getSMTPConfigFromEnv(): SMTPConfig {
        dotenv.config();

        return {
            host: getSmtpEnv("host"),
            port: parseInt(getSmtpEnv("port")),
            tls: getSmtpEnv("tls") === "yes",
            user: getSmtpEnv("user"),
            password: getSmtpEnv("password"),
            sender: getSmtpEnv("sender"),
        };
    }
}

function getSmtpEnv(name: string): string {
    const key = `SMTP_${name.toUpperCase()}`;
    const value = process.env[key];
    if (!value) throw new Error(`Missing .env configuration: ${key}`);
    return value;
}
