import { ProgramMetadata } from "data/d2-users/D2Users.types";
import { Async } from "domain/entities/Async";

export interface MetadataRepository {
    getMetadata(programId: string): Promise<Async<ProgramMetadata>>;
}
