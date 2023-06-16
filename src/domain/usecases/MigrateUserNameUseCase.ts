import jsonfile from "jsonfile";
import _ from "lodash";
import { createObjectCsvWriter } from "csv-writer";
import { NotificationsRepository } from "domain/repositories/NotificationsRepository";
import { UserRepository } from "domain/repositories/UserRepository";
import { Async } from "domain/entities/Async";
import { Stats } from "domain/entities/UserMigrateStatus";
import { Email, Attachment } from "domain/entities/Notification";
import { promiseMap } from "data/dhis2-utils";
import { mappedAttributes, User, UserAttribute } from "domain/entities/User";
import logger from "utils/log";

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

    async execute(options: MigrateOptions): Async<Stats> {
        const fromAttribute = mappedAttributes.find(attributeName => attributeName === options.from);
        const toAttribute = mappedAttributes.find(attributeName => attributeName === options.to);

        if (!fromAttribute || !toAttribute) {
            throw Error("Attribute not supported");
        }

        const users = await this.userRepository.getAll();
        const usersToChange = users
            .filter(user => {
                const { fromValue, toValue } = this.getValueFromProperties(user, fromAttribute, toAttribute);
                return (
                    fromValue && fromValue.toLowerCase() !== toValue.toLowerCase() && user.disabled === false
                );
            })
            .map(user => {
                const { fromValue } = this.getValueFromProperties(user, fromAttribute, toAttribute);
                return {
                    ...user,
                    [toAttribute]: fromValue,
                };
            });

        logger.debug(`Users: ${users.length}`);
        logger.debug(`Users to change: ${usersToChange.length}`);

        if (options.csvPath) {
            await this.generateCsvReport(options, usersToChange, fromAttribute, toAttribute);
        }

        if (options.post) {
            const newUser: User = {
                id: "l26khC7cbCy",
                email: "new@user.com",
                username: "new@user.com",
                disabled: false,
            };
            usersToChange.push(newUser);
            const migrateResult = await this.userRepository.saveAll(usersToChange);

            if (options.sendNotification && !migrateResult.errorMessage) {
                await this.sendNotifications(options, usersToChange, fromAttribute, toAttribute);
            }

            return migrateResult;
        }

        return {
            errorMessage: "",
            ignored: 0,
            updated: 0,
        };
    }

    private parseToCsv(users: User[], from: keyof UserAttribute, to: keyof UserAttribute) {
        return users.map(user => {
            const { fromValue, toValue } = this.getValueFromProperties(user, from, to);
            return {
                id: user.id,
                [from]: fromValue,
                [to]: toValue,
            };
        });
    }

    private async generateCsvReport(
        options: MigrateOptions,
        users: User[],
        from: keyof UserAttribute,
        to: keyof UserAttribute
    ) {
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

        logger.debug(`Generate report: ${options.csvPath}`);
        await csvWriter.writeRecords(this.parseToCsv(users, from, to));
    }

    private async sendNotifications(
        options: MigrateOptions,
        users: User[],
        from: keyof UserAttribute,
        to: keyof UserAttribute
    ) {
        const emailContent = await readJson(options.emailPathTemplate);
        const template = _.template(emailContent.body);
        const attachments = (emailContent.attachments || []).map(
            (path): Attachment => ({
                type: "file",
                path: path,
            })
        );

        await promiseMap(users, user => {
            const { fromValue, toValue } = this.getValueFromProperties(user, from, to);
            return this.notificationsRepository.send({
                recipients: [user.email],
                bcc: options.adminEmail ? [options.adminEmail] : undefined,
                subject: emailContent.subject,
                body: {
                    type: "html",
                    contents: template({
                        newValue: fromValue,
                        oldValue: toValue,
                    }),
                },
                attachments,
            });
        });
    }

    private getValueFromProperties(user: User, from: keyof UserAttribute, to: keyof UserAttribute) {
        const fromValue = user[from];
        const toValue = user[to];
        return { fromValue, toValue };
    }
}
