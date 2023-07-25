import { OrgUnit } from "domain/entities/OrgUnit";

export interface OrgUnitRepository {
    get(ids: string[]): Promise<OrgUnit[]>;
}
