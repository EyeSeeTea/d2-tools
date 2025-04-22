import { UsernameRename } from "domain/entities/UsernameRename";

export interface UsernameRenameRepository {
    run(mapping: UsernameRename[], options: { dryRun: boolean }): Promise<void>;
}
