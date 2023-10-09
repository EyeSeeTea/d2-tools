import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Timestamp } from "domain/entities/Date";
import { ProgramAttributes } from "domain/entities/ProgramAttributes";
import { ProgramExport } from "domain/entities/ProgramExport";
import { Stats } from "domain/entities/Stats";

export interface ProgramsRepository {
    export(options: { ids: Id[] }): Async<ProgramExport>;
    import(programExport: ProgramExport): Async<void>;
    runRules(options: RunRulesOptions): Async<void>;
    getAll(options: MoveProgramAttributeOptions): Async<ProgramAttributes[]>;
    saveAttributes(programs: ProgramAttributes[]): Async<Stats>;
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
}

export type MoveProgramAttributeOptions = {
    programId: Id;
    fromAttributeId: Id;
    toAttributeId: Id;
};
