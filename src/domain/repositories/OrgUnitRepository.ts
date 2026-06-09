import { Id, Identifiable } from "domain/entities/Base";
import { OrgUnit } from "domain/entities/OrgUnit";
import { Paginated } from "domain/entities/Pagination";

export interface OrgUnitRepository {
    getByIdentifiables(ids: Identifiable[]): Promise<OrgUnit[]>;
    getRoot(): Promise<OrgUnit>;
    getLeavesUnderRoots(rootIds: Id[], options: PaginationOptions): Promise<Paginated<OrgUnit>>;
    save(orgUnits: OrgUnit[]): Promise<void>;
}

export type PaginationOptions = { page: number; pageSize: number };
