import _ from "lodash";
import { Id, Identifiable } from "domain/entities/Base";
import { OrgUnit } from "domain/entities/OrgUnit";
import { OrgUnitRepository, PaginationOptions } from "domain/repositories/OrgUnitRepository";
import { Paginated } from "domain/entities/Pagination";

/* In-memory OrgUnitRepository for tests. It holds a flat list of org units and records the ones
   passed to save(), so use-case tests can assert what would be written. */
export class OrgUnitTestRepository implements OrgUnitRepository {
    public saved: OrgUnit[] = [];

    constructor(private orgUnits: OrgUnit[]) {}

    async getByIdentifiables(_ids: Identifiable[]): Promise<OrgUnit[]> {
        return this.orgUnits;
    }

    async getRoot(): Promise<OrgUnit> {
        const root = this.orgUnits.find(orgUnit => _.isEmpty(orgUnit.ancestors));
        if (!root) throw new Error("Root org unit not found");
        return root;
    }

    async getLeavesUnderRoots(rootIds: Id[], options: PaginationOptions): Promise<Paginated<OrgUnit>> {
        const { page, pageSize } = options;

        const leaves = this.orgUnits.filter(
            orgUnit => orgUnit.isLeaf && orgUnit.ancestors.some(ancestor => rootIds.includes(ancestor.id))
        );

        const objects = leaves.slice((page - 1) * pageSize, page * pageSize);
        const pageCount = Math.max(1, Math.ceil(leaves.length / pageSize));

        return { objects, pager: { page, pageSize, total: leaves.length, pageCount } };
    }

    async save(orgUnits: OrgUnit[]): Promise<void> {
        this.saved.push(...orgUnits);
    }
}
