import { Async } from "domain/entities/Async";
import log from "utils/log";
import _ from "lodash";
import { UserRolesRepository } from "domain/repositories/user-monitoring/authorities-monitoring/UserRolesRepository";
import { AuthoritiesMonitoringConfigRepository } from "domain/repositories/user-monitoring/authorities-monitoring/AuthoritiesMonitoringConfigRepository";
import { MessageRepository } from "domain/repositories/user-monitoring/authorities-monitoring/MessageRepository";
import { AuthoritiesMonitoringOptions } from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";
import { User } from "domain/entities/user-monitoring/authorities-monitoring/User";
import { GetUsersByAuthoritiesUseCase } from "./GetUsersByAuthoritiesUseCase";
import { CheckUserByAuthoritiesChangesUseCase } from "./CheckUserByAuthoritiesChangesUseCase";

export class MonitorUsersByAuthorityUseCase {
    constructor(
        private userRolesRepository: UserRolesRepository,
        private externalConfigRepository: AuthoritiesMonitoringConfigRepository,
        private MessageRepository: MessageRepository
    ) {}

    private listUsers(users: User[]): string {
        return users
            .map(
                u =>
                    `- ${u.name} in role(s): ${u.userRoles.map(role => `${JSON.stringify(role)}`).join(", ")}`
            )
            .join("\n");
    }

    private makeMessages(newUsers: UsersByAuthority, usersLosingAuth: UsersByAuthority): string {
        const messages = [];

        for (const [authority, users] of Object.entries(newUsers)) {
            messages.push(`New users with authority ${authority}:\n${this.listUsers(users)}`);
        }

        for (const [authority, users] of Object.entries(usersLosingAuth)) {
            messages.push(`Users losing authority ${authority}:\n${this.listUsers(users)}`);
        }

        return messages.join("\n\n");
    }

    private async saveAuthoritiesMonitor(
        options: AuthoritiesMonitoringOptions,
        usersByAuthority: UsersByAuthority
    ): Async<void> {
        options.lastExecution = logFormatDate(new Date());
        options.usersByAuthority = usersByAuthority;

        await this.externalConfigRepository.save(options);
    }

    async execute(options: AuthoritiesMonitoringOptions, setDataStore: boolean): Async<void> {
        log.info(`Get user roles by authorities: ${options.authoritiesToMonitor.join(",")}`);

        const getUsersUseCases = new GetUsersByAuthoritiesUseCase(this.userRolesRepository);
        const usersByAuthority = await getUsersUseCases.execute(options);

        log.debug(`Users by authority: ${JSON.stringify(usersByAuthority, null, 2)}`);

        if (!setDataStore) {
            const checkUsersChangesUseCase = new CheckUserByAuthoritiesChangesUseCase();
            const { newUsers, usersLosingAuth } = await checkUsersChangesUseCase.execute(
                options.usersByAuthority,
                usersByAuthority
            );

            log.debug(`New users: ${JSON.stringify(newUsers, null, 2)}`);
            log.debug(`Lost users: ${JSON.stringify(usersLosingAuth, null, 2)}`);

            if (_.isEmpty(newUsers) && _.isEmpty(usersLosingAuth)) {
                log.info("Report: No changes.");
            } else {
                const messages = this.makeMessages(newUsers, usersLosingAuth);
                // this.MessageRepository.sendMessage(messages);

                log.info(`Report:\n${messages}`);
            }
        }

        log.info("Updating datastore...");
        await this.saveAuthoritiesMonitor(options, usersByAuthority);
    }
}

type Authority = string;
type UsersByAuthority = Record<Authority, User[]>;

function logFormatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds},${milliseconds}`;
}
