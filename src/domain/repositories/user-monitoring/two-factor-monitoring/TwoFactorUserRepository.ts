import { Async } from "domain/entities/Async";
import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";

export interface TwoFactorUserRepository {
    getUsersNotInGroupIds(excludeUserGroupIds:string[]): Async<TwoFactorUser[]>;
}
