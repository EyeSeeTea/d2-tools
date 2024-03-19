import { Async } from "domain/entities/Async";
import { ProgramEvent } from "domain/entities/ProgramEvent";
import { MigrateOptions } from "domain/usecases/UpdateEventDataValueUseCase";

export interface EventExportRepository {
    saveReport(events: ProgramEvent[], options: MigrateOptions): Async<void>;
}
