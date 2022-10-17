import { Async } from "domain/entities/Async";
import { ProgramEvent } from "domain/entities/ProgramEvent";

export interface ProgramEventsExportRepository {
    save(options: ProgramEventsExportSaveOptions): Async<void>;
}

export interface ProgramEventsExportSaveOptions {
    events: ProgramEvent[];
    outputPath: string;
}
