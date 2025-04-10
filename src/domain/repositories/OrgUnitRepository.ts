import { Identifiable } from "domain/entities/Base";
import { OrgUnit, OrgUnitFields } from "domain/entities/OrgUnit";

export interface OrgUnitRepository {
    getByIdentifiables(ids: Identifiable[], fields?: OrgUnitFields): Promise<OrgUnit[]>;
    getRoot(): Promise<OrgUnit>;
}
