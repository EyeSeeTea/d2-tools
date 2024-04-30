import { Async } from "domain/entities/Async";
import log from "utils/log";
import _ from "lodash";
import { UserRolesRepository } from "domain/repositories/user-monitoring/authorities-monitoring/UserRolesRepository";
import { AuthoritiesMonitoringConfigRepository } from "domain/repositories/user-monitoring/authorities-monitoring/AuthoritiesMonitoringConfigRepository";
import { MessageRepository } from "domain/repositories/user-monitoring/authorities-monitoring/MessageRepository";
import { AuthoritiesMonitoringOptions } from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";
import { User } from "domain/entities/user-monitoring/authorities-monitoring/User";

export class MonitorUsersByAuthorityUseCase {
    constructor(
        private userRolesRepository: UserRolesRepository,
        private externalConfigRepository: AuthoritiesMonitoringConfigRepository,
        private MessageRepository: MessageRepository
    ) {}

    private async getUsersByAuthorities(options: AuthoritiesMonitoringOptions): Async<UsersByAuthority> {
        const userRoles = await this.userRolesRepository.getByAuthorities(
            options.AUTHORITIES_MONITOR.authoritiesToMonitor
        );

        const usersWithAuthorities = _(userRoles)
            .flatMap(userRole => {
                return userRole.users.map(user => {
                    return {
                        id: user.id,
                        name: user.name,
                        authorities: userRole.authorities.filter(authority =>
                            options.AUTHORITIES_MONITOR.authoritiesToMonitor.includes(authority)
                        ),
                        userRoles: userRoles
                            .filter(userRole => userRole.users.includes(user))
                            .map(userRole => ({ id: userRole.id, name: userRole.name })),
                    };
                });
            })
            .value();

        const usersByAuthority: UsersByAuthority = _(usersWithAuthorities)
            .groupBy(user => user.authorities)
            .mapValues(users =>
                users.map(user => ({ id: user.id, name: user.name, userRoles: user.userRoles }))
            )
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
        options: AuthoritiesMonitoringOptions,
        usersByAuthority: UsersByAuthority
    ): UsersByAuthority {
        const oldUsers: UsersByAuthority = options.AUTHORITIES_MONITOR.usersByAuthority;

        return this.compareDicts(oldUsers, usersByAuthority);
    }

    private checkUsersLosingAuthorities(
        options: AuthoritiesMonitoringOptions,
        usersByAuthority: UsersByAuthority
    ): UsersByAuthority {
        const oldUsers: UsersByAuthority = options.AUTHORITIES_MONITOR.usersByAuthority;

        return this.compareDicts(usersByAuthority, oldUsers);
    }

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
        options.AUTHORITIES_MONITOR.lastExecution = logFormatDate(new Date());
        options.AUTHORITIES_MONITOR.usersByAuthority = usersByAuthority;

        await this.externalConfigRepository.save(options);
    }

    async execute(options: AuthoritiesMonitoringOptions): Async<void> {
        log.info(
            `Get user roles by authorities: ${options.AUTHORITIES_MONITOR.authoritiesToMonitor.join(",")}`
        );

        const usersByAuthority = await this.getUsersByAuthorities(options);

        log.debug(`Users by authority: ${JSON.stringify(usersByAuthority, null, 2)}`);

        const newUsers = this.checkNewUsersWithAuthorities(options, usersByAuthority);

        log.debug(`New users: ${JSON.stringify(newUsers, null, 2)}`);

        const usersLosingAuth = this.checkUsersLosingAuthorities(options, usersByAuthority);

        log.debug(`Lost users: ${JSON.stringify(usersLosingAuth, null, 2)}`);

        if (_.isEmpty(newUsers) && _.isEmpty(usersLosingAuth)) {
            log.info("Report: No changes.");
        } else {
            const messages = this.makeMessages(newUsers, usersLosingAuth);

            log.info(`Report:\n${messages}`);

            this.MessageRepository.sendMessage(messages);
        }

        this.saveAuthoritiesMonitor(options, usersByAuthority);
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
