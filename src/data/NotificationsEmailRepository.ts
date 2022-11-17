import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
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

        const res = await transport.sendMail({
            to: notification.recipients,
            from: config.sender,
            subject: notification.subject,
            text: notification.body,
            attachments: notification.attachments.map(attachment => {
                const filename = path.basename(attachment.file);
                const content = fs.readFileSync(filename, "utf8");
                return { filename, content };
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
