import { ProgramMetadata } from "data/d2-users/D2Users.types";
import { Async } from "domain/entities/Async";
import { TemplateGroupWithAuthorities, UsersOptions } from "domain/entities/UserMonitoring";

export interface MetadataRepository {
    getTemplateAuthorities(options: UsersOptions): Promise<Async<TemplateGroupWithAuthorities[]>>;
    getMetadata(programId: string): Promise<Async<ProgramMetadata>>;
}
