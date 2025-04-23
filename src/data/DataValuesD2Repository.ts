import _ from "lodash";
import { DataValueAudit } from "@eyeseetea/d2-api/api/audit";

import log from "utils/log";
import { Async } from "domain/entities/Async";
import { DataValue, DataValuesMetadata, DataValueToPost } from "domain/entities/DataValue";
import { DataValuesRepository, DataValuesSelector } from "domain/repositories/DataValuesRepository";
import { D2Api } from "types/d2-api";
import { getInChunks, runMetadata } from "./dhis2-utils";
import { Id, indexById, NamedRef, Ref } from "domain/entities/Base";
import logger from "utils/log";
import { getUid } from "./dhis2";

export class DataValuesD2Repository implements DataValuesRepository {
    constructor(private api: D2Api) {}

    async get(options: DataValuesSelector): Async<DataValue[]> {
        const dataElementGroupsAll = options.allDataElements
            ? [(await this.createGroupWithAllDataElements()).id]
            : undefined;

        const res$ = this.api.dataValues.getSet({
            dataSet: options.dataSetIds || [],
            orgUnit: options.orgUnitIds || [],
            dataElementGroup: dataElementGroupsAll || options.dataElementGroupIds || [],
            orgUnitGroup: options.orgUnitGroupIds || [],
            period: options.periods,
            children: options.children,
            includeDeleted: options.includeDeleted,
            startDate: options.startDate,
            endDate: options.endDate,
            limit: options.limit,
            lastUpdated: options.lastUpdated,
        });

        const res = await res$.getData();

        if (dataElementGroupsAll) {
            await this.deleteDataElementGroups(dataElementGroupsAll);
        }
        return res.dataValues;
    }

    async post(options: { dataValues: DataValueToPost[] }): Async<void> {
        const { dataValues } = options;
        if (_.isEmpty(dataValues)) return;
        const res = await this.api.dataValues.postSet({ force: true }, { dataValues }).getData();
        log.debug(`POST /dataValues response: ${JSON.stringify(res.importCount)}`);

        if (res.status !== "SUCCESS") {
            throw new Error(`Error on post: ${JSON.stringify(res, null, 4)}`);
        }
    }

    async getMetadata(options: { dataValues: DataValue[] }): Async<DataValuesMetadata> {
        const { dataValues } = options;

        const ids = {
            dataElements: _.uniq(dataValues.map(dv => dv.dataElement)),
            cocs: _(dataValues)
                .flatMap(dv => [dv.categoryOptionCombo, dv.attributeOptionCombo])
                .uniq()
                .value(),
            orgUnits: _.uniq(dataValues.map(dv => dv.orgUnit)),
        };

        return {
            dataElements: indexById(await this.getPaginated("dataElements", ids.dataElements)),
            categoryOptionCombos: indexById(await this.getPaginated("categoryOptionCombos", ids.cocs)),
            orgUnits: indexById(await this.getPaginated("organisationUnits", ids.orgUnits)),
        };
    }

    private async getPaginated<Model extends "dataElements" | "categoryOptionCombos" | "organisationUnits">(
        model: Model,
        ids: Id[]
    ): Promise<NamedRef[]> {
        return getInChunks(ids, async idsGroup => {
            const res$ = this.api.metadata.get({
                [model]: {
                    fields: { id: true, name: true },
                    filter: { id: { in: idsGroup } },
                },
            });
            return res$.getData().then(res => res[model]);
        });
    }

    async getAudits(options: DataValuesSelector): Async<DataValueAudit[]> {
        const res$ = this.api.audit.getDataValues({
            ds: options.dataSetIds,
            ou: options.orgUnitIds,
            pe: options.periods,
            de: options.dataElements,
            pageSize: 1e6,
        });

        const res = await res$.getData();
        return res.objects;
    }

    private async createGroupWithAllDataElements(): Promise<Ref> {
        logger.info(`Create temporal group containing all data elements`);

        const { dataElements } = await this.api.metadata
            .get({
                dataElements: {
                    fields: { id: true },
                },
            })
            .getData();

        const dataElementGroup = {
            id: getUid("dataElementGroup", "ALL"),
            name: "All data elements",
            shortName: "All",
            dataElements: dataElements.map(de => ({ id: de.id })),
        };

        await runMetadata(
            this.api.metadata.post({
                dataElementGroups: [dataElementGroup],
            })
        );

        return dataElementGroup;
    }

    private async deleteDataElementGroups(dataElementGroupIds: Id[]): Promise<void> {
        logger.info(`Delete temporal group containing all data elements: ${dataElementGroupIds}`);

        const payload = {
            dataElementGroups: dataElementGroupIds.map(id => ({ id })),
        };

        try {
            await runMetadata(this.api.metadata.post(payload, { importStrategy: "DELETE" }));
        } catch (e) {
            logger.warn(`Error deleting dataElementGroup: ${JSON.stringify(e)}`);
        }
    }
}
