import { Id, NamedRef } from "domain/entities/Base";
import { Timestamp } from "domain/entities/Date";
import { getMonthsDiff } from "domain/entities/DateTime";

export interface TwoFactorUser {
    id: Id;
    twoFA: boolean;
    username: string;
    disabled: boolean;
    externalAuth: boolean;
    userGroups: NamedRef[];
    created: Timestamp;
}

export interface UserDateOverride {
    createdDate: string;
    users: Array<{ id: string; username?: string }>;
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

    const now = new Date().toISOString();
    return users.filter(user => {
        const monthsDiff = getMonthsDiff(user.created, now);
        return monthsDiff >= disableAfterMonths;
    });
}

export function applyUserDateOverrides(
    users: TwoFactorUser[],
    overrides: UserDateOverride | undefined
): TwoFactorUser[] {
    if (!overrides) return users;
    const overrideIds = new Set(overrides.users.map(u => u.id));
    return users.map(user =>
        overrideIds.has(user.id) ? { ...user, created: overrides.createdDate } : user
    );
}
