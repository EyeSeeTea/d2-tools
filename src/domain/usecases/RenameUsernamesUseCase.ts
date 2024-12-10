import { UsernameRename } from "domain/entities/UsernameRename";
import { UsernameRenameRepository } from "domain/repositories/UsernameRenameRepository";

export class RenameUsernameUseCase {
    constructor(private repository: UsernameRenameRepository) {}

    async execute(mapping: UsernameRename[], options: { dryRun: boolean }): Promise<void> {
        return this.repository.run(mapping, options);
    }
}
