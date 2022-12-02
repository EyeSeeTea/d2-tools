import { Async } from "domain/entities/Async";
import { ProgramsRepository, RunRulesOptions } from "domain/repositories/ProgramsRepository";
import { UsersOptions, UsersRepository } from "domain/repositories/UsersRepository";

export class RunUserPermissionsUseCase {
    constructor(private userRepository: UsersRepository) {}

    async execute(options: UsersOptions): Async<void> {
        await this.userRepository.checkPermissions(options);
    }
}
