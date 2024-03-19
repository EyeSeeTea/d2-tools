import { OrgUnitAction } from "domain/OrgUnitAction";
import { OrgUnitActionRepository } from "domain/repositories/OrgUnitActionRepository";

export interface GenerateDeleteOrgUnitsActionUseCaseOptions {
    level?: number;
    path?: string;
    outputFile?: string;
    overwrite: boolean;
}

export class GenerateDeleteOrgUnitsActionUseCase {
    constructor(private orgUnitActionRepository: OrgUnitActionRepository) {}

    execute(action: OrgUnitAction, options: GenerateDeleteOrgUnitsActionUseCaseOptions) {
        return this.orgUnitActionRepository.save(action, options);
    }
}
