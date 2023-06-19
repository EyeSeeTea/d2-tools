import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { UserRepository } from "domain/repositories/UserRepository";
import { User } from "domain/entities/User";
import { Stats } from "domain/entities/Stats";
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

    async saveAll(users: User[]): Async<Stats> {
        const userToSaveIds = users.map(user => user.id);
        const stats = await getInChunks<Stats>(userToSaveIds, async userIds => {
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
                    const postUsers = userIds.map(userId => {
                        const existingD2User = res.users.find(d2User => d2User.id === userId);
                        const user = users.find(user => user.id === userId);
                        if (!user) {
                            throw Error("Cannot find user");
                        }
                        if (!existingD2User)
                            return {
                                id: user.id,
                                firstName: user.firstName,
                                surname: user.surname,
                                email: user.email,
                                userCredentials: {
                                    username: user.username,
                                    disabled: user.disabled,
                                },
                            };

                        return {
                            ...existingD2User,
                            firstName: user.firstName,
                            surname: user.surname,
                            email: user.email,
                            userCredentials: {
                                ...existingD2User.userCredentials,
                                username: user.username,
                                disabled: user.disabled,
                            },
                        };
                    });
                    return postUsers;
                })
                .then(usersToSave => {
                    return this.api.metadata.post({ users: usersToSave }).response();
                })
                .then(responses => {
                    const userIdsWithErrors = responses.data.typeReports
                        .flatMap(tr => tr.objectReports)
                        .flatMap(or => or.uid);

                    const errorMessage = responses.data.typeReports
                        .flatMap(x => x.objectReports)
                        .flatMap(x => x.errorReports)
                        .map(x => x.message)
                        .join("\n");

                    return [
                        {
                            usersWithError: userIdsWithErrors,
                            errorMessage,
                            created: responses.data.stats.created,
                            ignored: responses.data.stats.ignored,
                            updated: responses.data.stats.updated,
                        },
                    ];
                })
                .catch(() => {
                    console.error(`Error getting users ${userIds.join(",")}`);
                    return [];
                });
        });

        return stats.reduce(
            (acum, stat) => {
                return {
                    usersWithError: [...acum.usersWithError, ...stat.usersWithError],
                    errorMessage: `${acum.errorMessage}${stat.errorMessage}`,
                    created: acum.created + stat.created,
                    ignored: acum.ignored + stat.ignored,
                    updated: acum.updated + stat.updated,
                };
            },
            {
                usersWithError: [],
                errorMessage: "",
                created: 0,
                ignored: 0,
                updated: 0,
            }
        );
    }

    async getAll(): Async<User[]> {
        const { users } = await this.api.metadata
            .get({
                users: {
                    fields: {
                        id: true,
                        email: true,
                        userCredentials: userCredentialsFields,
                        firstName: true,
                        surname: true,
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
                firstName: d2User.firstName,
                surname: d2User.surname,
            };
        });
    }
}
