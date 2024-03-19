import { Identifiable } from "domain/entities/Base";
import { OrgUnit } from "domain/entities/OrgUnit";

export interface OrgUnitRepository {
    getByIdentifiables(ids: Identifiable[]): Promise<OrgUnit[]>;
}
