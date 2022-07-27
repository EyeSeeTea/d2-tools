import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { ProgramExport } from "domain/entities/ProgramExport";

export interface ProgramsRepository {
    export(options: { ids: Id[] }): Async<ProgramExport>;
    import(programExport: ProgramExport): Async<void>;
    runRules(options: RunRulesOptions): Async<void>;
}

export interface RunRulesOptions {
    programIds: Id[];
    teiId?: Id;
    programRulesIds?: Id[];
    orgUnitsIds?: Id[];
    startDate?: string;
    endDate?: string;
    reportPath?: string;
    post: boolean;
}
