import { Async } from "domain/entities/Async";
import { ProgramDetails } from "domain/entities/user-monitoring/common/ProgramDetails";

export interface UserMonitoringMetadataRepository {
    getMetadata(programId: string): Promise<Async<ProgramDetails>>;
}
