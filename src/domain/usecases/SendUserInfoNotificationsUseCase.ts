import { UserRepository } from "domain/repositories/UserRepository";
import { NotificationsRepository } from "domain/repositories/NotificationsRepository";
import { UserInfoNotificationsRepository } from "domain/repositories/UserInfoNotificationsRepository";
import { Path } from "domain/entities/Base";
import log from "utils/log";
import _ from "lodash";
import { promiseMap } from "data/dhis2-utils";
import { User } from "domain/entities/User";
import { Maybe } from "utils/ts-utils";
import { Attachment } from "domain/entities/Notification";

interface Options {
    url: string;
    userDetailsFile: Path;
    emailContentFile: Path;
}

interface UserDetails extends User {
    password: string;
}

export class SendUserInfoNotificationsUseCase {
    constructor(
        private userInfoNotificationRepository: UserInfoNotificationsRepository,
        private recipientRepository: UserRepository,
        private notificationsRepository: NotificationsRepository
    ) {}

    async execute(options: Options) {
        log.debug(`Get User Info and Email Content`);
        const userInfoNotification = await this.userInfoNotificationRepository.get(
            options.userDetailsFile,
            options.emailContentFile
        );

        log.debug(`Get emails for each user in CSV file from DHIS2`);
        const usernames = _(userInfoNotification.userInfos)
            .map(({ username }) => username)
            .value();
        const recipients = await this.recipientRepository.getByUsernames(usernames);

        log.debug(`Send user info email to: ${recipients.join(", ")}`);
        const recipientsMap = _.keyBy(recipients, recipient => recipient.username);

        const userDetails = _(userInfoNotification.userInfos)
            .map((userInfo): Maybe<UserDetails> => {
                const user = recipientsMap[userInfo.username];
                return user ? { ...userInfo, id: user.id, email: user.email } : undefined;
            })
            .compact()
            .value();

        const interpolation = _.template(userInfoNotification.email.body);
        const attachments = (userInfoNotification.email.attachments || []).map(
            (path): Attachment => ({
                type: "file",
                path: path,
            })
        );

        await promiseMap(userDetails, userDetail =>
            this.notificationsRepository.send({
                recipients: [userDetail.email],
                subject: userInfoNotification.email.subject,
                body: {
                    type: "html",
                    contents: interpolation({
                        username: userDetail.username,
                        password: userDetail.password,
                    }),
                },
                attachments: attachments,
            })
        );
    }
}
