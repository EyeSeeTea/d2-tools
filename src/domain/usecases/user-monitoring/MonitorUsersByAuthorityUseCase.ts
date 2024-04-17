import { Async } from "domain/entities/Async";
import { NamedRef } from "domain/entities/Base";
import log from "utils/log";
import _ from "lodash";
import { UserMonitoringConfig } from "domain/entities/user-monitoring/UserMonitoring";
import { MessageRepository } from "domain/repositories/user-monitoring/MessageRepository";
import { UserRolesRepository } from "domain/repositories/user-monitoring/UserRolesRepository";
import { UserMonitoringConfigRepository } from "domain/config/repositories/UserMonitoringConfigRepository";

export class MonitorUsersByAuthorityUseCase {
    constructor(
        private userRolesRepository: UserRolesRepository,
        private externalConfigRepository: UserMonitoringConfigRepository,
        private MessageRepository: MessageRepository
    ) {}

    private async getUsersByAuthorities(options: UserMonitoringConfig): Async<UsersByAuthority> {
        const userRoles = await this.userRolesRepository.getByAuthorities(
            options.authoritiesMonitor.authoritiesToMonitor
        );

        const usersWithAuthorities = _(userRoles)
            .flatMap(userRole => {
                return userRole.users.map(user => {
                    return {
                        id: user.id,
                        name: user.name,
                        authorities: userRole.authorities.filter(authority =>
                            options.authoritiesMonitor.authoritiesToMonitor.includes(authority)
                        ),
                    };
                });
            })
            .uniqBy(user => user.id)
            .value();

        const usersByAuthority: UsersByAuthority = _(usersWithAuthorities)
            .groupBy(user => user.authorities)
            .mapValues(users => users.map(user => ({ id: user.id, name: user.name })))
            .value();

        return usersByAuthority;
    }

    private compareDicts(dict1: UsersByAuthority, dict2: UsersByAuthority) {
        // TODO: // check _ intersection, union, difference, differenceBy
        return _(dict2).reduce((result, users, authority) => {
            const diff = _(users)
                .map(user => {
                    if (!dict1[authority]?.some(u => u.id === user.id)) {
                        return user;
                    }
                })
                .compact()
                .value();

            if (diff.length > 0) {
                result[authority] = diff;
            }

            return result;
        }, {} as UsersByAuthority);
    }

    private checkNewUsersWithAuthorities(
        options: UserMonitoringConfig,
        usersByAuthority: UsersByAuthority
    ): UsersByAuthority {
        const oldUsers: UsersByAuthority = options.authoritiesMonitor.usersByAuthority;

        return this.compareDicts(oldUsers, usersByAuthority);
    }

    private checkUsersLosingAuthorities(
        options: UserMonitoringConfig,
        usersByAuthority: UsersByAuthority
    ): UsersByAuthority {
        const oldUsers: UsersByAuthority = options.authoritiesMonitor.usersByAuthority;

        return this.compareDicts(usersByAuthority, oldUsers);
    }

    private makeMessages(newUsers: UsersByAuthority, usersLosingAuth: UsersByAuthority): string {
        const messages = [];

        for (const [authority, users] of Object.entries(newUsers)) {
            messages.push(
                `New users with authority ${authority}:\n${users.map(u => "- " + u.name).join("\n")}`
            );
        }

        for (const [authority, users] of Object.entries(usersLosingAuth)) {
            messages.push(
                `Users losing authority ${authority}:\n${users.map(u => "- " + u.name).join("\n")}`
            );
        }

        return messages.join("\n\n");
    }

    private async saveAuthoritiesMonitor(
        options: UserMonitoringConfig,
        usersByAuthority: UsersByAuthority
    ): Async<void> {
        options.authoritiesMonitor.lastExecution = logFormatDate(new Date());
        options.authoritiesMonitor.usersByAuthority = usersByAuthority;

        await this.externalConfigRepository.save(options);
    }

    async execute(options: UserMonitoringConfig): Async<void> {
        log.info(
            `Get user roles by authorities: ${options.authoritiesMonitor.authoritiesToMonitor.join(",")}`
        );

        const usersByAuthority = await this.getUsersByAuthorities(options);

        log.debug(`Users by authority: ${JSON.stringify(usersByAuthority, null, 2)}`);

        const newUsers = this.checkNewUsersWithAuthorities(options, usersByAuthority);

        log.debug(`New users: ${JSON.stringify(newUsers, null, 2)}`);

        const usersLosingAuth = this.checkUsersLosingAuthorities(options, usersByAuthority);

        log.debug(`Lost users: ${JSON.stringify(usersLosingAuth, null, 2)}`);

        const messages = this.makeMessages(newUsers, usersLosingAuth);

        log.info(`Report:\n${messages}`);

        this.MessageRepository.sendMessage(messages);

        this.saveAuthoritiesMonitor(options, usersByAuthority);
    }
}

type Authority = string;
type UsersByAuthority = Record<Authority, NamedRef[]>;

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
