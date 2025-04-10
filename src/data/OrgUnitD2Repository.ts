import { D2Api } from "types/d2-api";
import { OrgUnit, OrgUnitFields } from "domain/entities/OrgUnit";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import _ from "lodash";
import { promiseMap } from "./dhis2-utils";
import { Identifiable } from "domain/entities/Base";

const defaultFields: OrgUnitFields = {
    id: true,
    code: true,
    name: true,
};

export class OrgUnitD2Repository implements OrgUnitRepository {
    constructor(private api: D2Api) {}

    async getRoot(): Promise<OrgUnit> {
        const response = await this.api.metadata
            .get({
                organisationUnits: {
                    fields: {
                        id: true,
                        code: true,
                        name: true,
                    },
                    filter: {
                        level: {
                            eq: "1",
                        },
                    },
                },
            })
            .getData();

        const rootOrgUnit = response.organisationUnits[0];
        if (!rootOrgUnit) {
            throw new Error("Root org unit not found");
        }

        return rootOrgUnit;
    }

    async getByIdentifiables(values: Identifiable[], fields?: OrgUnitFields): Promise<OrgUnit[]> {
        return this.getOrgUnits(values, fields);
    }

    private async getOrgUnits(values: Identifiable[], fields?: OrgUnitFields) {
        const orgUnits = await promiseMap(_.chunk(values, 50), async chunkValues => {
            const response = await this.api.metadata
                .get({
                    organisationUnits: {
                        fields: fields || defaultFields,
                        filter: {
                            identifiable: {
                                in: chunkValues,
                            },
                        },
                    },
                })
                .getData();

            return response.organisationUnits;
        });
        return _(orgUnits).flatten().value();
    }
}
