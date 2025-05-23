import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { Id, Identifiable } from "domain/entities/Base";
import { UserRepository } from "domain/repositories/UserRepository";
import { User } from "domain/entities/User";
import { Stats } from "domain/entities/Stats";
import { getInChunks, promiseMap } from "./dhis2-utils";

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
        const stats = await getInChunks<string, Stats>(userToSaveIds, async userIds => {
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

                        return {
                            ...(existingD2User || {}),
                            id: user.id,
                            firstName: user.firstName,
                            surname: user.surname,
                            email: user.email,
                            userCredentials: {
                                ...(existingD2User?.userCredentials || {}),
                                username: user.username,
                                disabled: user.disabled,
                            },
                        };
                    });
                    return postUsers;
                })
                .then(usersToSave => {
                    return this.api.metadata
                        .post({ users: usersToSave })
                        .response()
                        .then(response => {
                            return { usersToSave, response };
                        });
                })
                .then((result): Stats[] => {
                    const response = result.response.data;
                    const errorMessage = response.typeReports
                        .flatMap(x => x.objectReports)
                        .flatMap(x => x.errorReports)
                        .map(x => x.message)
                        .join("\n");

                    return [
                        {
                            recordsSkipped:
                                response.status === "ERROR" ? result.usersToSave.map(user => user.id) : [],
                            errorMessage,
                            ...response.stats,
                        },
                    ];
                })
                .catch((err): Stats[] => {
                    const errorMessage = `Error getting users ${userIds.join(",")}`;
                    console.error(errorMessage, err);
                    return [
                        {
                            ...Stats.empty(),
                            recordsSkipped: userIds,
                            errorMessage,
                            ignored: userIds.length,
                        },
                    ];
                });
        });

        return Stats.combine(stats);
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

    async getFromGroupByIdentifiables(values: Identifiable[]): Async<User[]> {
        const response = await this.api.metadata
            .get({
                userGroups: {
                    fields: {
                        id: true,
                        users: true,
                    },
                    filter: {
                        identifiable: {
                            in: values,
                        },
                    },
                },
            })
            .getData();

        const allUsers = _(response.userGroups)
            .flatMap(ug => ug.users)
            .value();

        if (allUsers.length === 0) return [];

        const ids = allUsers.map(user => user.id);
        const users = await promiseMap(_.chunk(ids, 50), async userIds => {
            const response = await this.api.metadata
                .get({
                    users: {
                        filter: {
                            id: {
                                in: userIds,
                            },
                        },
                        fields: {
                            id: true,
                            email: true,
                            userCredentials: {
                                username: true,
                            },
                        },
                    },
                })
                .getData();

            return response.users.map(d2User => {
                return {
                    id: d2User.id,
                    email: d2User.email,
                    username: d2User.userCredentials.username,
                };
            });
        });

        return _(users).flatten().value();
    }

    async getByIdentifiables(values: Identifiable[]): Async<User[]> {
        const { users } = await this.api.metadata
            .get({
                users: {
                    fields: {
                        id: true,
                        email: true,
                        userCredentials: { username: true },
                        dataViewOrganisationUnits: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    filter: {
                        id: {
                            in: values,
                        },
                    },
                },
            })
            .getData();

        return users.map(d2User => {
            return {
                ...d2User,
                username: d2User.userCredentials.username,
                orgUnits: d2User.dataViewOrganisationUnits,
            };
        });
    }
}
