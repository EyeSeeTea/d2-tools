import _ from "lodash";
import { D2Api, MetadataPick } from "types/d2-api";
import { Id, Identifiable } from "domain/entities/Base";
import { OrgUnit } from "domain/entities/OrgUnit";
import { OrgUnitRepository, PaginationOptions } from "domain/repositories/OrgUnitRepository";
import { Paginated } from "domain/entities/Pagination";
import { promiseMap, runMetadata } from "./dhis2-utils";

const orgUnitFields = {
    id: true,
    code: true,
    name: true,
    level: true,
    ancestors: { id: true, name: true },
    children: { id: true, name: true },
} as const;

type D2OrgUnit = MetadataPick<{
    organisationUnits: { fields: typeof orgUnitFields };
}>["organisationUnits"][number];

function toDomain(d2OrgUnit: D2OrgUnit): OrgUnit {
    return OrgUnit.create({
        id: d2OrgUnit.id,
        name: d2OrgUnit.name,
        code: d2OrgUnit.code ?? "",
        level: d2OrgUnit.level,
        ancestors: d2OrgUnit.ancestors,
        children: d2OrgUnit.children,
    });
}

export class OrgUnitD2Repository implements OrgUnitRepository {
    constructor(private api: D2Api) {}

    async getRoot(): Promise<OrgUnit> {
        const { objects } = await this.api.models.organisationUnits
            .get({ fields: orgUnitFields, filter: { level: { eq: "1" } }, paging: false })
            .getData();

        const rootOrgUnit = objects[0];
        if (!rootOrgUnit) throw new Error("Root org unit not found");

        return toDomain(rootOrgUnit);
    }

    async getByIdentifiables(values: Identifiable[]): Promise<OrgUnit[]> {
        const orgUnits = await promiseMap(_.chunk(values, 50), async chunkValues => {
            const { objects } = await this.api.models.organisationUnits
                .get({ fields: orgUnitFields, filter: { identifiable: { in: chunkValues } }, paging: false })
                .getData();
            return objects;
        });

        return _(orgUnits).flatten().map(toDomain).value();
    }

    async getLeavesUnderRoots(rootIds: Id[], options: PaginationOptions): Promise<Paginated<OrgUnit>> {
        const { page, pageSize } = options;

        const { objects, pager } = await this.api.models.organisationUnits
            .get({
                fields: orgUnitFields,
                filter: { "ancestors.id": { in: rootIds } },
                order: "id:asc",
                page,
                pageSize,
            })
            .getData();

        const leaves = objects.map(toDomain).filter(orgUnit => orgUnit.isLeaf);

        return { objects: leaves, pager };
    }

    async save(orgUnits: OrgUnit[]): Promise<void> {
        if (_.isEmpty(orgUnits)) return;

        const orgUnitById = _.keyBy(orgUnits, orgUnit => orgUnit.id);

        await promiseMap(_.chunk(orgUnits, 200), async chunk => {
            const ids = chunk.map(orgUnit => orgUnit.id);

            // Merge the entity's writable fields into the full owner payload: the import needs the
            // whole owner object (otherwise unset properties are cleared), and we only override the
            // fields the entity owns (name, code) leaving derived/navigational ones untouched.
            const { objects: owners } = await this.api.models.organisationUnits
                .get({ fields: { $owner: true }, filter: { id: { in: ids } }, paging: false })
                .getData();

            const organisationUnits = owners.map(owner => {
                const orgUnit = orgUnitById[owner.id];
                return orgUnit
                    ? {
                          ...owner,
                          name: orgUnit.name,
                          code: orgUnit.code,
                          // Attributes ancestors/children are not required when saving, only
                          // parent.id in case we are moving the org unit to another parent.
                          ...(orgUnit.parentRef ? { parent: orgUnit.parentRef } : {}),
                      }
                    : owner;
            });

            await runMetadata(this.api.metadata.post({ organisationUnits }));
        });
    }
}
