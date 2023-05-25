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

    async getByUserName(username: string): Async<User | undefined> {
        const { users } = await this.api.metadata
            .get({
                users: {
                    fields: {
                        id: true,
                        email: true,
                        userCredentials: { username: true },
                    },
                    filter: {
                        "userCredentials.username": { eq: username },
                    },
                },
            })
            .getData();

        return _(users)
            .map(d2User => ({
                id: d2User.id,
                email: d2User.email,
                username: d2User.userCredentials.username,
            }))
            .first();
    }

    async updateUserName(oldUserName: string, newUserName: string): Async<string> {
        const { users } = await this.api.metadata
            .get({
                users: {
                    fields: {
                        $all: true,
                    },
                    filter: {
                        "userCredentials.username": { eq: oldUserName },
                    },
                },
            })
            .getData();
        const currentUser = _(users).first();
        if (!currentUser) return "";

        const userUpdate = this.api.metadata.post(
            {
                users: [
                    {
                        ...currentUser,
                        email: newUserName,
                        userCredentials: {
                            ...currentUser.userCredentials,
                            username: newUserName,
                        },
                    },
                ],
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
        console.log(errorMessage);
        return errorMessage;
    }
}
