import { Async } from "domain/entities/Async";
import { ProgramsRepository, RunRulesOptions } from "domain/repositories/ProgramsRepository";

export class RunProgramRulesUseCase {
    constructor(private programsRepository: ProgramsRepository) {}

    async execute(options: RunRulesOptions): Async<void> {
        await this.programsRepository.runRules(options);
    }
}
