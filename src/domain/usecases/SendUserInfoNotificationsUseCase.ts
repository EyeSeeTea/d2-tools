import { RecipientRepository } from "domain/repositories/RecipientRepository";
import { NotificationsRepository } from "domain/repositories/NotificationsRepository";
import { UserInfoNotificationsRepository } from "domain/repositories/UserInfoNotificationsRepository";
import { Path } from "domain/entities/Base";
import log from "utils/log";
import _ from "lodash";
import { UsernameEmail } from "domain/entities/Notification";
import { promiseMap } from "data/dhis2-utils";

interface Options {
    url: string;
    userDetailsFile: Path;
    emailContentFile: Path;
}

interface UserDetails extends UsernameEmail {
    password: string;
}

export class SendUserInfoNotificationsUseCase {
    constructor(
        private userInfoNotificationRepository: UserInfoNotificationsRepository,
        private recipientRepository: RecipientRepository,
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
            .compact()
            .value();
        const recipients = await this.recipientRepository.getByUsernames(usernames);

        log.debug(`Send user info email to: ${recipients.join(", ")}`);
        const recipientsMap = recipients.reduce<{ [index: string]: UsernameEmail }>((acc, curr) => {
            acc[curr.username] = curr;
            return acc;
        }, {});

        const userDetails: UserDetails[] = userInfoNotification.userInfos.map(userInfo =>
            Object.assign(userInfo, recipientsMap[userInfo.username as keyof typeof recipientsMap])
        );

        const interpolation = _.template(userInfoNotification.email.body);
        await promiseMap(userDetails, userDetail =>
            this.notificationsRepository.send({
                recipients: [userDetail.email],
                subject: userInfoNotification.email.subject,
                body: interpolation({ password: userDetail.password }),
                attachments: [],
            })
        );
    }
}
