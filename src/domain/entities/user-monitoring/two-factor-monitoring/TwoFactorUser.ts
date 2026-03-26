import { Id, NamedRef } from "domain/entities/Base";
import { Timestamp } from "domain/entities/Date";

export interface TwoFactorUser {
    id: Id;
    twoFA: boolean;
    username: string;
    disabled: boolean;
    externalAuth: boolean;
    userGroups: NamedRef[];
    created: Timestamp;
}

export function filterByCreationDate(
    users: TwoFactorUser[],
    disableAfterMonths: number | undefined
): TwoFactorUser[] {
    if (disableAfterMonths === undefined) {
        throw new Error(
            "filteredByMonth is enabled but disableAfterMonths is not configured in the datastore."
        );
    }

    const now = new Date();
    return users.filter(user => {
        const createdDate = new Date(user.created);
        const monthsDiff =
            (now.getFullYear() - createdDate.getFullYear()) * 12 +
            (now.getMonth() - createdDate.getMonth());
        return monthsDiff >= disableAfterMonths;
    });
}
