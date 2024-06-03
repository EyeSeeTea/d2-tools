import { Async } from "domain/entities/Async";
import { UserMonitoringProgramMetadata } from "domain/entities/user-monitoring/common/UserMonitoringProgramMetadata";

export interface UserMonitoringProgramRepository {
    get(programId: string): Async<UserMonitoringProgramMetadata>;
}
