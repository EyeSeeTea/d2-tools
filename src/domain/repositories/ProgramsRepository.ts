import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { ProgramExport } from "domain/entities/ProgramExport";

export interface ProgramsRepository {
    export(options: { ids: Id[] }): Async<ProgramExport>;
    import(programExport: ProgramExport): Async<void>;
    runRules(options: { ids: Id[] }): Async<void>;
}
