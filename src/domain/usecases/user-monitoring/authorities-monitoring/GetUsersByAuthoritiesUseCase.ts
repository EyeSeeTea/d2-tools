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
                        username: user.username,
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
            // used to avoid groupBy merging multiples authorities as a separate key
            .flatMap(user => {
                if (user.authorities.length > 1) {
                    return user.authorities.map(auth => {
                        return {
                            ...user,
                            authorities: [auth],
                        };
                    });
                } else {
                    return user;
                }
            })
            .groupBy(user => user.authorities)
            // merge repeated users originating from different userRoles
            .mapValues(users =>
                _(users)
                    .map(user => {
                        const repeated = users
                            .filter(u => u.id === user.id)
                            .map(u => ({ id: u.id, username: u.username, userRoles: u.userRoles }));

                        if (repeated.length > 1) {
                            return repeated.reduce((acc, u) => {
                                return {
                                    id: u.id,
                                    username: u.username,
                                    userRoles: _.uniqBy([...acc.userRoles, ...u.userRoles], "id"),
                                };
                            });
                        } else {
                            return { id: user.id, username: user.username, userRoles: user.userRoles };
                        }
                    })
                    .uniqBy("id")
                    .value()
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
