import { Async } from "domain/entities/Async";
import { OrgUnitAction } from "domain/OrgUnitAction";

export interface OrgUnitActionRepository {
    save(action: OrgUnitAction, options: OrgUnitActionRepositoryDeleteOptions): Async<void>;
}

export interface OrgUnitActionRepositoryDeleteOptions {
    outputFile?: string;
    overwrite: boolean;
}
