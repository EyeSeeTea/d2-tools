import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Email, UsernameEmail } from "domain/entities/Notification";
import { RecipientRepository } from "domain/repositories/RecipientRepository";

export class RecipientD2Repository implements RecipientRepository {
    constructor(private api: D2Api) {}

    async getByIds(ids: Id[]): Async<Email[]> {
        const { users: usersFromGroups } = await this.api.metadata
            .get({
                users: {
                    fields: { email: true },
                    filter: { "userGroups.id": { in: ids } },
                },
            })
            .getData();

        const { users } = await this.api.metadata
            .get({
                users: {
                    fields: { email: true },
                    filter: { id: { in: ids } },
                },
            })
            .getData();

        return _(usersFromGroups)
            .concat(users)
            .map(user => user.email)
            .compact()
            .value();
    }

    async getByUsernames(usernames: string[]): Async<UsernameEmail[]> {
        const { users } = await this.api.metadata
            .get({
                users: {
                    fields: { username: true, email: true },
                    filter: { username: { in: usernames } },
                },
            })
            .getData();

        // @ts-ignore
        return users;
        // return _(users)
        //     .map(user => user.email)
        //     .compact()
        //     .value();
    }
}
