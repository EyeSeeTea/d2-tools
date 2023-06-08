import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { UserRepository } from "domain/repositories/UserRepository";
import { User, UserMigrate } from "domain/entities/User";
import { MigrationResult } from "domain/entities/UserMigrateStatus";

export class UserD2Repository implements UserRepository {
    constructor(private api: D2Api) {}

    async getByIds(ids: Id[]): Async<User[]> {
        const { users: usersFromGroups } = await this.api.metadata
            .get({
                users: {
                    fields: { id: true, email: true, userCredentials: { username: true } },
                    filter: { "userGroups.id": { in: ids } },
                },
            })
            .getData();

        const { users } = await this.api.metadata
            .get({
                users: {
                    fields: { id: true, email: true, userCredentials: { username: true } },
                    filter: { id: { in: ids } },
                },
            })
            .getData();

        return _(usersFromGroups)
            .concat(users)
            .map(user => ({
                id: user.id,
                email: user.email,
                username: user.userCredentials.username,
            }))
            .compact()
            .value();
    }

    async getByUsernames(usernames: string[]): Async<User[]> {
        const usernamesSet = new Set(usernames);

        const { users } = await this.api.metadata
            .get({
                users: {
                    fields: {
                        id: true,
                        email: true,
                        userCredentials: { username: true },
                    },
                },
            })
            .getData();

        return _(users)
            .filter(user => usernamesSet.has(user.userCredentials?.username))
            .map(user => ({
                id: user.id,
                email: user.email,
                username: user.userCredentials.username,
            }))
            .compact()
            .value();
    }

    async updateUserName(
        fromProperty: string,
        toProperty: string,
        usersToUpdate: UserMigrate[]
    ): Async<MigrationResult> {
        const { users } = await this.api.metadata
            .get({
                users: {
                    fields: {
                        $owner: true,
                    },
                    filter: {
                        id: {
                            in: usersToUpdate.map(u => u.id),
                        },
                    },
                },
            })
            .getData();

        const postUsers = users.map(d2User => {
            const fromValue = _.get(d2User, fromProperty);
            const userUpdated = _.set(d2User, toProperty, fromValue);
            return userUpdated;
        });

        const userUpdate = this.api.metadata.post(
            {
                users: postUsers,
            },
            {
                importStrategy: "UPDATE",
            }
        );

        const userUpdateResponse = await userUpdate.response();
        const errorMessage = userUpdateResponse.data.typeReports
            .flatMap(x => x.objectReports)
            .flatMap(x => x.errorReports)
            .map(x => x.message)
            .join(". ");

        return {
            errorMessage: errorMessage,
            stats: {
                ignored: userUpdateResponse.data.stats.ignored,
                updated: userUpdateResponse.data.stats.updated,
            },
        };
    }

    async getAll(): Async<UserMigrate[]> {
        const { users } = await this.api.metadata
            .get({
                users: {
                    fields: {
                        id: true,
                        email: true,
                        userCredentials: { username: true, disabled: true },
                    },
                },
            })
            .getData();

        return users.map(d2User => {
            return {
                id: d2User.id,
                userCredentials: {
                    username: d2User.userCredentials?.username,
                },
                email: d2User.email,
                disabled: d2User.userCredentials?.disabled,
            };
        });
    }
}
