import _ from "lodash";
import { command, option, subcommands, string, boolean, flag } from "cmd-ts";
import { UserD2Repository } from "data/UserD2Repository";
import { getApiUrlOption, getD2Api } from "scripts/common";
import { MigrateUserNameUseCase } from "domain/usecases/MigrateUserNameUseCase";
import { NotificationsEmailRepository } from "data/NotificationsEmailRepository";
import logger from "utils/log";

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
            adminEmail: option({
                type: string,
                long: "admin-email",
                description: "Administrator email to be notified as BCC",
                defaultValue: () => "",
            }),
            emailPathTemplate: option({
                type: string,
                long: "template-path",
                description:
                    "Path to the json file with email template information (body, subject, attachments). Required if you pass the --send-notification flag",
                defaultValue: () => "",
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

            logger.info(`Migrate results: ${JSON.stringify(migrateResult.stats)}`);

            if (!migrateResult.errorMessage) {
                if (!args.adminEmail) {
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

    return subcommands({
        name: "users",
        cmds: { migrate: migrateUser },
    });
}
