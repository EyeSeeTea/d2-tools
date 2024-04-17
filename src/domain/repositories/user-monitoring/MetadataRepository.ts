import { ProgramMetadata } from "data/d2-users/D2Users.types";
import { Async } from "domain/entities/Async";
import {
    TemplateGroupWithAuthorities,
    UserMonitoringConfig,
} from "domain/entities/user-monitoring/UserMonitoring";

export interface MetadataRepository {
    getTemplateAuthorities(options: UserMonitoringConfig): Promise<Async<TemplateGroupWithAuthorities[]>>;
    getMetadata(programId: string): Promise<Async<ProgramMetadata>>;
}
