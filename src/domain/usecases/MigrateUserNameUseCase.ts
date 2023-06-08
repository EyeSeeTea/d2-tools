import jsonfile from "jsonfile";
import _ from "lodash";
import { createObjectCsvWriter } from "csv-writer";
import { NotificationsRepository } from "domain/repositories/NotificationsRepository";
import { UserRepository } from "domain/repositories/UserRepository";
import { Async } from "domain/entities/Async";
import { MigrationResult } from "domain/entities/UserMigrateStatus";
import { Email, Attachment } from "domain/entities/Notification";
import { promiseMap } from "data/dhis2-utils";
import { UserMigrate } from "domain/entities/User";

export type MigrateOptions = {
    from: string;
    to: Email;
    sendNotification: boolean;
    adminEmail: Email;
    emailPathTemplate: string;
    post: boolean;
    csvPath: string;
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
        const users = await this.userRepository.getAll();
        const usersToUpdate = users.filter(u => {
            const fromValue = _.get(u, options.from);
            const toValue = _.get(u, options.to);
            return fromValue !== toValue && u.disabled === false;
        });

        if (options.csvPath) {
            const csvWriter = createObjectCsvWriter({
                path: options.csvPath,
                header: [
                    {
                        id: "id",
                        title: "ID",
                    },
                    {
                        id: options.from,
                        title: options.from,
                    },
                    {
                        id: options.to,
                        title: options.to,
                    },
                ],
            });
            await csvWriter.writeRecords(this.parseToCsv(usersToUpdate, options));
        }

        if (options.post) {
            const migrateResult = await this.userRepository.updateUserName(
                options.from,
                options.to,
                usersToUpdate
            );

            if (options.sendNotification && migrateResult.errorMessage) {
                const emailContent = await readJson(options.emailPathTemplate);
                const template = _.template(emailContent.body);
                const attachments = (emailContent.attachments || []).map(
                    (path): Attachment => ({
                        type: "file",
                        path: path,
                    })
                );

                await promiseMap(usersToUpdate, user =>
                    this.notificationsRepository.send({
                        recipients: [user.email],
                        bcc: options.adminEmail ? [options.adminEmail] : undefined,
                        subject: emailContent.subject,
                        body: {
                            type: "html",
                            contents: template({
                                from: _.get(user, options.from),
                                to: _.get(user, options.to),
                            }),
                        },
                        attachments,
                    })
                );
            }

            return migrateResult;
        }

        return {
            errorMessage: "",
            stats: {
                ignored: 0,
                updated: 0,
            },
        };
    }

    private parseToCsv(users: UserMigrate[], options: MigrateOptions) {
        return users.map(user => {
            return {
                id: user.id,
                [options.from]: _.get(user, options.from),
                [options.to]: _.get(user, options.to),
            };
        });
    }
}
