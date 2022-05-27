import { ApiContext } from "@eyeseetea/d2-api";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { ProgramExport } from "domain/entities/ProgramExport";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";

export class ExportProgramsUseCase {
    constructor(private programsRepository: ProgramsRepository) {}

    async execute(options: { ids: Id[] }): Async<ProgramExport> {
        const programExport = await this.programsRepository.export(options);
        console.log(programExport);
        return programExport;
    }
}
