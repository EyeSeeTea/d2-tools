import _ from "lodash";
import { Async } from "../../../entities/Async";
import { UsersByAuthority } from "../../../entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";

export class CheckUserByAuthoritiesChangesUseCase {
    constructor() {}

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
        oldUsers: UsersByAuthority,
        usersByAuthority: UsersByAuthority
    ): UsersByAuthority {
        return this.compareDicts(oldUsers, usersByAuthority);
    }

    private checkUsersLosingAuthorities(
        oldUsers: UsersByAuthority,
        usersByAuthority: UsersByAuthority
    ): UsersByAuthority {
        return this.compareDicts(usersByAuthority, oldUsers);
    }

    async execute(
        oldUsers: UsersByAuthority,
        usersByAuthority: UsersByAuthority
    ): Async<UserByAuthoritiesChanges> {
        const newUsers = this.checkNewUsersWithAuthorities(oldUsers, usersByAuthority);
        const usersLosingAuth = this.checkUsersLosingAuthorities(oldUsers, usersByAuthority);

        return { newUsers, usersLosingAuth };
    }
}

interface UserByAuthoritiesChanges {
    newUsers: UsersByAuthority;
    usersLosingAuth: UsersByAuthority;
}
