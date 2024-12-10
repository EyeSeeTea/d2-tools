import _ from "lodash";
import { command, option, subcommands, string, boolean, flag } from "cmd-ts";
import { UserD2Repository } from "data/UserD2Repository";
import { StringsSeparatedByCommas, getApiUrlOption, getD2Api } from "scripts/common";
import { MigrateUserNameUseCase } from "domain/usecases/MigrateUserNameUseCase";
import { NotificationsEmailRepository } from "data/NotificationsEmailRepository";
import logger from "utils/log";
import { RenameUsernameUseCase } from "domain/usecases/RenameUsernamesUseCase";
import { UsernameRenameSqlRepository } from "data/UsernameRenameSqlRepository";
import { Maybe } from "utils/ts-utils";
import { UsernameRename } from "domain/entities/UsernameRename";

export function getCommand() {
    const migrateUser = command({
        name: "username migration",
        description: "migrate user email to username",
        args: {
            url: getApiUrlOption(),
            from: option({
                type: string,
                long: "from",
                description: "Property to copy. Must be a valid USER property",
            }),
            to: option({
                type: string,
                long: "to",
                description: "Property to be updated. Must be a valid USER property",
            }),
            sendNotification: flag({
                type: boolean,
                long: "send-notification",
                description:
                    "Sends an email with the information of the change to the affected user and the administrator",
            }),
            adminEmails: option({
                type: StringsSeparatedByCommas,
                long: "admin-email",
                description: "Administrator email to be notified as BCC",
            }),
            emailPathTemplate: option({
                type: string,
                long: "template-path",
                description:
                    "Path to the json file with email template information (body, subject, attachments). Required if you pass the --send-notification flag",
            }),
            emailAdminPathTemplate: option({
                type: string,
                long: "template-admin-path",
                description:
                    "Path to the json file with email template information for admins. Required if you pass the --send-notification flag",
            }),
            post: flag({
                long: "post",
                description: "Save changes",
                defaultValue: () => false,
            }),
            csvPath: option({
                type: string,
                long: "csv-path",
                description: "Path for the CSV report",
                defaultValue: () => "",
            }),
        },
        handler: async args => {
            if (args.sendNotification && !args.emailPathTemplate) {
                logger.error("Add --template-path='path_to_json_file' for email template.");
                process.exit(1);
            }

            const api = getD2Api(args.url);
            const userRepository = new UserD2Repository(api);
            const notificationsRepository = new NotificationsEmailRepository();

            const migrateResult = await new MigrateUserNameUseCase(
                userRepository,
                notificationsRepository
            ).execute(args);

            logger.info(`Migrate results: ${JSON.stringify(migrateResult)}`);

            if (!migrateResult.errorMessage) {
                if (!args.sendNotification) {
                    logger.info(`Add --send-notifiction to notify every user affected`);
                }

                if (!args.adminEmails) {
                    logger.info(`Add --admin-email='admin@example.com' to notify the administrator`);
                }

                if (!args.post) {
                    logger.info(`Add --post to save changes`);
                }

                if (!args.csvPath) {
                    logger.info(`Add --csv-path to generate a csv report`);
                }

                process.exit(0);
            } else {
                logger.info(`Error: ${migrateResult.errorMessage}`);
                process.exit(1);
            }
        },
    });

    const renameUsername = command({
        name: "Rename username",
        description: "Rename occurences of a username in the DHIS2 database",
        args: {
            mapping: option({
                type: string,
                long: "mapping",
                description: "oldusername:newusername,...",
            }),
            dryRun: flag({
                type: boolean,
                long: "dry-run",
                description: "The SQL will be executed within a rollback transaction",
            }),
            sqlFilePath: option({
                type: string,
                long: "output",
                description: "Path to the output file (SQL)",
            }),
        },
        handler: async args => {
            const mapping = getMappingFromCommaSeparatedKeyValues(args.mapping);
            const repository = new UsernameRenameSqlRepository(args.sqlFilePath);
            await new RenameUsernameUseCase(repository).execute(mapping, { dryRun: args.dryRun });
        },
    });

    return subcommands({
        name: "users",
        cmds: {
            migrate: migrateUser,
            "rename-username": renameUsername,
        },
    });
}

function getMappingFromCommaSeparatedKeyValues(strMapping: string) {
    return _(strMapping.split(","))
        .map((mapping: string): Maybe<UsernameRename> => {
            const [from, to] = mapping.split(":");
            return from && to ? { from, to } : undefined;
        })
        .compact()
        .value();
}
