import fs from "fs";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Timestamp } from "domain/entities/Date";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";
import log from "utils/log";

export class ExportProgramsUseCase {
    constructor(private programsRepository: ProgramsRepository) {}

    async execute(options: ExportProgramsOptions): Async<void> {
        const { outputFile } = options;
        const programExport = await this.programsRepository.export(options);
        const json = JSON.stringify(programExport, null, 4);
        fs.writeFileSync(outputFile, json);
        log.info(`Written: ${outputFile}`);
    }
}

interface ExportProgramsOptions {
    ids: Id[];
    outputFile: string;
    orgUnitIds?: Id[];
    startDate?: Timestamp;
    endDate?: Timestamp;
    descendants?: boolean;
    skipMetadata?: boolean;
}
