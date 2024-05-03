import { UserWithoutTwoFactor } from "domain/entities/user-monitoring/common/UserWithoutTwoFactor";

export interface TwoFactorReportRepository {
    save(programId: string, response: UserWithoutTwoFactor): Promise<string>;
}
