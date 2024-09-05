import _ from "lodash";
import log from "utils/log";
import { Async } from "domain/entities/Async";

import { MessageRepository } from "domain/repositories/user-monitoring/common/MessageRepository";
import { UserRolesRepository } from "domain/repositories/user-monitoring/authorities-monitoring/UserRolesRepository";
import { AuthoritiesMonitoringConfigRepository } from "domain/repositories/user-monitoring/authorities-monitoring/AuthoritiesMonitoringConfigRepository";

import { User } from "domain/entities/user-monitoring/authorities-monitoring/User";
import { AuthoritiesMonitoringOptions } from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";

import { GetUsersByAuthoritiesUseCase } from "./GetUsersByAuthoritiesUseCase";
import { CheckUserByAuthoritiesChangesUseCase } from "./CheckUserByAuthoritiesChangesUseCase";
import { GetAuthoritiesMonitoringConfigUseCase } from "./GetAuthoritiesMonitoringConfigUseCase";
import { SaveAuthoritiesMonitoringConfigUseCase } from "./SaveAuthoritiesMonitoringConfigUseCase";

export class MonitorUsersByAuthorityUseCase {
    constructor(
        private userRolesRepository: UserRolesRepository,
        private externalConfigRepository: AuthoritiesMonitoringConfigRepository,
        private MessageRepository: MessageRepository
    ) {}

    private debugJSON(msg: string, data: any) {
        log.debug(`${msg} ${JSON.stringify(data, null, 2)}`);
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

    async execute(setDataStore: boolean): Async<void> {
        const options: AuthoritiesMonitoringOptions = await new GetAuthoritiesMonitoringConfigUseCase(
            this.externalConfigRepository
        ).execute();

        log.info(`Get user roles by authorities: ${options.authoritiesToMonitor.join(",")}`);

        const getUsersUseCases = new GetUsersByAuthoritiesUseCase(this.userRolesRepository);
        const usersByAuthority = await getUsersUseCases.execute(options);

        this.debugJSON("Users by authority:", usersByAuthority);

        if (!setDataStore) {
            const checkUsersChangesUseCase = new CheckUserByAuthoritiesChangesUseCase();
            const { newUsers, usersLosingAuth } = await checkUsersChangesUseCase.execute(
                options.usersByAuthority,
                usersByAuthority
            );

            this.debugJSON("New users:", newUsers);
            this.debugJSON("Lost users:", usersLosingAuth);

            if (_.isEmpty(newUsers) && _.isEmpty(usersLosingAuth)) {
                log.info("Report: No changes.");
            } else {
                const messages = this.makeMessages(newUsers, usersLosingAuth);
                const teamsStatus = await this.MessageRepository.sendMessage(
                    "AUTHORITIES-MONITORING",
                    messages
                );
                if (teamsStatus) {
                    log.info(`Message sent to MSTeams`);
                }

                log.info(`Report:\n${messages}`);
            }
        }

        log.info("Updating datastore...");
        await new SaveAuthoritiesMonitoringConfigUseCase(this.externalConfigRepository).execute(
            options,
            usersByAuthority
        );
    }
}

type Authority = string;
type UsersByAuthority = Record<Authority, User[]>;
