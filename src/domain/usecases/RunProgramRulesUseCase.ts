import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";

export class RunProgramRulesUseCase {
    constructor(private programsRepository: ProgramsRepository) {}

    async execute(options: { ids: Id[] }): Async<void> {
        await this.programsRepository.runRules(options);
    }
}
