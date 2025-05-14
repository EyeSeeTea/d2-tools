import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Timestamp } from "domain/entities/Date";
import { Program, ProgramType } from "domain/entities/Program";
import { ProgramExport } from "domain/entities/ProgramExport";

export interface ProgramsRepository {
    get(options: { ids?: Id[]; programTypes?: ProgramType[] }): Async<Program[]>;
    export(options: { ids: Id[] }): Async<ProgramExport>;
    import(programExport: ProgramExport): Async<void>;
    runRules(options: RunRulesOptions): Async<void>;
    getAppUrl(options: { programId: Id; orgUnitId: Id }): string;
}

export interface RunRulesOptions {
    programIds: Id[];
    teiId?: Id;
    programRulesIds?: Id[];
    orgUnitsIds?: Id[];
    orgUnitGroupIds?: Id[];
    startDate?: Timestamp;
    endDate?: Timestamp;
    reportPath?: string;
    post: boolean;
    payloadPath?: string;
    backup: boolean;
}
