import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Id } from "domain/entities/Base";
import { OrgUnit } from "domain/entities/OrgUnit";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import _ from "lodash";
import { promiseMap } from "./dhis2-utils";

export class OrgUnitD2Repository implements OrgUnitRepository {
    constructor(private api: D2Api) {}

    async get(values: string[]): Promise<OrgUnit[]> {
        return this.getOrgUnits(values);
    }

    private async getOrgUnits(values: string[]) {
        const orgUnits = await promiseMap(_.chunk(values, 50), async chunkValues => {
            const response = await this.api.metadata
                .get({
                    organisationUnits: {
                        fields: {
                            id: true,
                            code: true,
                            name: true,
                        },
                        filter: {
                            identifiable: {
                                in: chunkValues,
                            },
                        },
                    },
                })
                .getData();

            return response.organisationUnits.map(d2OrgUnit => {
                return {
                    id: d2OrgUnit.id,
                    code: d2OrgUnit.code,
                    name: d2OrgUnit.name,
                };
            });
        });
        return _(orgUnits).flatten().value();
    }
}
