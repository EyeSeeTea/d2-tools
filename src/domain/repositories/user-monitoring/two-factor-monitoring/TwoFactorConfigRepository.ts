import { Async } from "domain/entities/Async";
import { TwoFactorUserOptions } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserOptions";

export interface TwoFactorConfigRepository {
    get(): Async<TwoFactorUserOptions>;
}
