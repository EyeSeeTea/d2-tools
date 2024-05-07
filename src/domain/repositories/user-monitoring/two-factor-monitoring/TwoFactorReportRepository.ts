import { UserMonitoringProgramMetadata } from "domain/entities/user-monitoring/common/UserMonitoringProgramMetadata";
import { TwoFactorUserReport } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserReport";

export interface TwoFactorReportRepository {
    save(program: UserMonitoringProgramMetadata, response: TwoFactorUserReport): Promise<string>;
}
