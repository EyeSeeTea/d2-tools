import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { UserRepository } from "domain/repositories/UserRepository";
import { User, UserAttribute } from "domain/entities/User";
import { MigrationResult } from "domain/entities/UserMigrateStatus";
import { getInChunks } from "./dhis2-utils";

const userCredentialsFields = { username: true, disabled: true };

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

    async saveAll(users: User[], from: UserAttribute, to: UserAttribute): Async<MigrationResult> {
        const usersToSave = await getInChunks(
            users.map(u => u.id),
            async userIds => {
                return this.api.metadata
                    .get({
                        users: {
                            fields: {
                                $owner: true,
                            },
                            filter: {
                                id: {
                                    in: userIds,
                                },
                            },
                        },
                    })
                    .getData()
                    .then(res => {
                        const postUsers = res.users.map(d2User => {
                            const fromValue = _.get(d2User, from.value);
                            const userUpdated = _.set(d2User, to.value, fromValue);
                            return userUpdated;
                        });
                        return postUsers;
                    })
                    .catch(() => {
                        console.error(`Error getting users ${userIds.join(",")}`);
                        return [];
                    });
            }
        );

        const userUpdate = this.api.metadata.post(
            {
                users: usersToSave,
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

    async getAll(): Async<User[]> {
        const { users } = await this.api.metadata
            .get({
                users: {
                    fields: {
                        id: true,
                        email: true,
                        userCredentials: userCredentialsFields,
                    },
                },
            })
            .getData();

        return users.map(d2User => {
            return {
                id: d2User.id,
                username: d2User.userCredentials?.username,
                email: d2User.email,
                disabled: d2User.userCredentials?.disabled,
            };
        });
    }
}
