import { TwoFactorUserOptions } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserOptions";

export interface TwoFactorConfigRepository {
    get(): Promise<TwoFactorUserOptions>;
}
