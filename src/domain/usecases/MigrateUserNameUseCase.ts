import jsonfile from "jsonfile";
import _ from "lodash";
import { NotificationsRepository } from "domain/repositories/NotificationsRepository";
import { UserRepository } from "domain/repositories/UserRepository";
import { Async } from "domain/entities/Async";
import { User } from "domain/entities/User";
import { UserMigrateStatus } from "domain/entities/UserMigrateStatus";
import { Email, Attachment } from "domain/entities/Notification";

export type MigrateOptions = {
    from: string;
    to: Email;
    sendNotification: boolean;
    adminEmail: Email;
    emailPathTemplate: string;
};

type MigrationResult = {
    status: UserMigrateStatus;
    errorMessage: string;
};

type EmailTemplate = {
    subject: string;
    body: string;
    attachments?: string[];
};

function readJson(path: string): Promise<EmailTemplate> {
    return jsonfile.readFile(path);
}

export class MigrateUserNameUseCase {
    constructor(
        private userRepository: UserRepository,
        private notificationsRepository: NotificationsRepository
    ) {}

    async execute(options: MigrateOptions): Async<MigrationResult> {
        const user = await this.userRepository.getByUserName(options.from);
        const migrationResult: MigrationResult = {
            status: checkStatus(user, options.to),
            errorMessage: "",
        };

        if (migrationResult.status === "OK") {
            migrationResult.errorMessage = await this.userRepository.updateUserName(options.from, options.to);
            migrationResult.status = migrationResult.errorMessage ? "ERROR" : migrationResult.status;

            if (options.sendNotification && !migrationResult.errorMessage) {
                const emailContent = await readJson(options.emailPathTemplate);
                const template = _.template(emailContent.body);
                const attachments = (emailContent.attachments || []).map(
                    (path): Attachment => ({
                        type: "file",
                        path: path,
                    })
                );

                await this.notificationsRepository.send({
                    recipients: [options.to],
                    bcc: options.adminEmail ? [options.adminEmail] : undefined,
                    subject: emailContent.subject,
                    body: {
                        type: "html",
                        contents: template({
                            ...user,
                            from: options.from,
                            to: options.to,
                        }),
                    },
                    attachments,
                });
            }
        }

        return migrationResult;
    }
}

function checkStatus(user: User | undefined, newUserName: string): UserMigrateStatus {
    if (!user || !newUserName) {
        return "USER_NOT_FOUND";
    } else if (newUserName === user.username) {
        return "USER_EMAIL_EQUAL";
    } else {
        return "OK";
    }
}
