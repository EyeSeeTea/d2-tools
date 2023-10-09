import jsonfile from "jsonfile";
import _ from "lodash";
import { createObjectCsvWriter } from "csv-writer";
import { NotificationsRepository } from "domain/repositories/NotificationsRepository";
import { UserRepository } from "domain/repositories/UserRepository";
import { Async } from "domain/entities/Async";
import { Stats } from "domain/entities/Stats";
import { Email, Attachment } from "domain/entities/Notification";
import { promiseMap } from "data/dhis2-utils";
import { mappedAttributes, User, UserAttribute } from "domain/entities/User";
import logger from "utils/log";

export type MigrateOptions = {
    from: string;
    to: Email;
    sendNotification: boolean;
    adminEmails: Email[];
    emailAdminPathTemplate: string;
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

type UserAttributeKey = keyof UserAttribute;

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
        const nonDisabledUsers = users.filter(user => {
            const { fromValue, toValue } = this.getValueFromProperties(user, fromAttribute, toAttribute);
            return fromValue && fromValue.toLowerCase() !== toValue.toLowerCase() && user.disabled === false;
        });

        const usersToChange = nonDisabledUsers.map(user => {
            const { fromValue } = this.getValueFromProperties(user, fromAttribute, toAttribute);
            return {
                ...user,
                [toAttribute]: fromValue,
            };
        });

        logger.debug(`Users: ${users.length}`);
        logger.debug(`Users to change: ${usersToChange.length}`);

        if (options.csvPath) {
            await this.generateCsvReport(options, nonDisabledUsers, fromAttribute, toAttribute);
        }

        if (options.post) {
            const migrateResult = await this.userRepository.saveAll(usersToChange);

            if (options.sendNotification) {
                const onlySuccessUsers = _.differenceWith(
                    nonDisabledUsers,
                    migrateResult.recordsSkipped,
                    (user, userError) => user.id === userError
                );
                await this.sendNotifications(options, onlySuccessUsers, fromAttribute, toAttribute);
            }

            return migrateResult;
        }

        return {
            recordsSkipped: [],
            errorMessage: "",
            created: 0,
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
        from: UserAttributeKey,
        to: UserAttributeKey
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
        from: UserAttributeKey,
        to: UserAttributeKey
    ) {
        const emailContent = await readJson(options.emailPathTemplate);
        const template = _.template(emailContent.body);
        const attachments = (emailContent.attachments || []).map(
            (path): Attachment => ({ type: "file", path: path })
        );

        const emailContentAdmin = await readJson(options.emailAdminPathTemplate);
        const templateAdmin = _.template(emailContentAdmin.body);
        const attachmentsAdmin = (emailContentAdmin.attachments || []).map(
            (path): Attachment => ({ type: "file", path: path })
        );

        await promiseMap(users, async user => {
            const { fromValue, toValue } = this.getValueFromProperties(user, from, to);

            const namespace = {
                userId: user.id,
                newValue: fromValue,
                oldValue: toValue,
            };

            await this.notificationsRepository.send({
                recipients: [user.email],
                subject: emailContent.subject,
                body: { type: "html", contents: template(namespace) },
                attachments,
            });

            await this.notificationsRepository.send({
                recipients: options.adminEmails,
                subject: emailContentAdmin.subject,
                body: { type: "html", contents: templateAdmin(namespace) },
                attachments: attachmentsAdmin,
            });
        });
    }

    private getValueFromProperties(user: User, from: UserAttributeKey, to: UserAttributeKey) {
        const fromValue = user[from];
        const toValue = user[to];
        return { fromValue, toValue };
    }
}
