import { command, positional, subcommands } from "cmd-ts";
import { NotificationsEmailRepository } from "data/NotificationsEmailRepository";
import { RecipientD2Repository } from "data/RecipientD2Repository";
import { UserInfoNotificationDefaultRepository } from "data/UserInfoNotificationsDefaultRepository";
import { SendUserInfoNotificationsUseCase } from "domain/usecases/SendUserInfoNotificationsUseCase";
import { getApiUrlOption, getD2Api } from "scripts/common";

export function getCommand() {
    return subcommands({
        name: "notifications",
        cmds: {
            "send-user-info-notification": sendUserInfoNotification,
        },
    });
}

const sendUserInfoNotification = command({
    name: "send-user-info-notification",
    description: "Send an email to a list of users",
    args: {
        url: getApiUrlOption(),
        userDetailsFile: positional({
            displayName: "PATH_TO_USER_DETAILS_CSV",
            description: "Input file for user details (CSV)",
        }),
        emailContentFile: positional({
            displayName: "PATH_TO_EMAIL_CONTENT_JSON",
            description: "Input file for email content (JSON)",
        }),
    },
    handler: async args => {
        const api = getD2Api(args.url);
        const userInfoEmailRepository = new UserInfoNotificationDefaultRepository();
        const notificationsRepository = new NotificationsEmailRepository();
        const recipientRepository = new RecipientD2Repository(api);

        new SendUserInfoNotificationsUseCase(
            userInfoEmailRepository,
            recipientRepository,
            notificationsRepository
        ).execute(args);
    },
});
