import { TwoFactorUserReport } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserReport";

export interface TwoFactorReportRepository {
    save(programId: string, response: TwoFactorUserReport): Promise<string>;
}
