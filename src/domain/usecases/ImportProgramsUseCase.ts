import fs from "fs";
import { Async } from "domain/entities/Async";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";
import log from "utils/log";

export class ImportProgramsUseCase {
    constructor(private programsRepository: ProgramsRepository) {}

    async execute(options: { inputFile: string }): Async<void> {
        const { inputFile } = options;
        const json = fs.readFileSync(inputFile, "utf8");
        const programExport = JSON.parse(json);
        await this.programsRepository.import(programExport);
        log.info(`Written: ${inputFile}`);
    }
}
