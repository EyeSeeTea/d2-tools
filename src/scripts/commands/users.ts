import _ from "lodash";
import { command, option, subcommands, string, boolean, flag } from "cmd-ts";
import { UserD2Repository } from "data/UserD2Repository";
import { getApiUrlOption, getD2Api } from "scripts/common";
import { MigrateUserNameUseCase } from "domain/usecases/MigrateUserNameUseCase";
import { NotificationsEmailRepository } from "data/NotificationsEmailRepository";
import logger from "utils/log";
import { UserMigrateStatus } from "domain/entities/UserMigrateStatus";

export function getCommand() {
    const migrateUser = command({
        name: "username migration",
        description: "migrate user email to username",
        args: {
            url: getApiUrlOption(),
            from: option({
                type: string,
                long: "from",
                description: "Current username",
            }),
            to: option({
                type: string,
                long: "to",
                description: "New username",
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
        },
        handler: async args => {
            if (args.sendNotification && !args.emailPathTemplate) {
                logger.error("Add --template-path='path_to_json_file' for email template.");
                process.exit(1);
            }

            const api = getD2Api(args.url);
            const userRepository = new UserD2Repository(api);
            const notificationsRepository = new NotificationsEmailRepository();

            const { status, errorMessage } = await new MigrateUserNameUseCase(
                userRepository,
                notificationsRepository
            ).execute(args);

            const mapMessage = new Map<UserMigrateStatus, string>();
            mapMessage.set("OK", "User updated.");
            mapMessage.set("USER_NOT_FOUND", `User ${args.from} does not exist.`);
            mapMessage.set("USER_EMAIL_EQUAL", `User and email are equals.`);
            mapMessage.set("ERROR", errorMessage);

            logger.info(`Status: ${status}`);
            logger.info(mapMessage.get(status) || "");

            if (status === "OK") {
                if (!args.adminEmail) {
                    logger.info(`Add --admin-email='admin@example.com' to notify the administrator`);
                }
                process.exit(0);
            } else {
                process.exit(1);
            }
        },
    });

    return subcommands({
        name: "users",
        cmds: { migrate: migrateUser },
    });
}
