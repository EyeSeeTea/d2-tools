import _ from "lodash";
import { Async } from "domain/entities/Async";

import {
    AuthoritiesMonitoringOptions,
    UsersByAuthority,
} from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";
import { UserRolesRepository } from "domain/repositories/user-monitoring/authorities-monitoring/UserRolesRepository";

export class GetUsersByAuthoritiesUseCase {
    constructor(private userRolesRepository: UserRolesRepository) {}

    private async getUsersByAuthorities(options: AuthoritiesMonitoringOptions): Async<UsersByAuthority> {
        const userRoles = await this.userRolesRepository.getByAuthorities(options.authoritiesToMonitor);

        const usersWithAuthorities = _(userRoles)
            .flatMap(userRole => {
                return userRole.users.map(user => {
                    return {
                        id: user.id,
                        name: user.name,
                        authorities: userRole.authorities.filter(authority =>
                            options.authoritiesToMonitor.includes(authority)
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

        options.authoritiesToMonitor
            .filter(authority => !usersByAuthority[authority])
            .forEach(authority => {
                usersByAuthority[authority] = [];
            });

        return usersByAuthority;
    }

    async execute(options: AuthoritiesMonitoringOptions): Async<UsersByAuthority> {
        const usersByAuthority = await this.getUsersByAuthorities(options);

        return usersByAuthority;
    }
}
