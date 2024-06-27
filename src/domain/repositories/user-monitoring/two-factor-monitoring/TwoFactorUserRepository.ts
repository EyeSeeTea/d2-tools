import { Async } from "domain/entities/Async";
import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";

export interface TwoFactorUserRepository {
    getUsersByGroupId(groupIds: string[]): Async<TwoFactorUser[]>;
}
