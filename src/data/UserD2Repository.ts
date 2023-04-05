import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { UserRepository } from "domain/repositories/UserRepository";
import { User } from "domain/entities/User";

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
}
