import fs from "fs";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";
import log from "utils/log";

export class ExportProgramsUseCase {
    constructor(private programsRepository: ProgramsRepository) {}

    async execute(options: { ids: Id[]; outputFile: string }): Async<void> {
        const { outputFile } = options;
        const programExport = await this.programsRepository.export(options);
        const json = JSON.stringify(programExport, null, 4);
        fs.writeFileSync(outputFile, json);
        log.info(`Written: ${outputFile}`);
    }
}
