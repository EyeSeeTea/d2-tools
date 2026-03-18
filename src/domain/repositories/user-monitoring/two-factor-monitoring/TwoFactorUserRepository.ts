import { Async } from "domain/entities/Async";
import { DisableUserResult } from "domain/entities/user-monitoring/two-factor-monitoring/DisableUsersResult";
import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";

export interface TwoFactorUserRepository {
    getUsersNotInGroupIds(excludeUserGroupIds: string[]): Async<TwoFactorUser[]>;
    disableUsers(userIds: string[]): Async<DisableUserResult[]>;
}
