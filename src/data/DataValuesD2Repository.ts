import { DataValueAudit } from "@eyeseetea/d2-api/api/audit";
import { Async } from "domain/entities/Async";
import { DataValue, DataValueToPost } from "domain/entities/DataValue";
import { DataValuesRepository, DataValuesSelector } from "domain/repositories/DataValuesRepository";
import { D2Api } from "types/d2-api";
import log from "utils/log";

export class DataValuesD2Repository implements DataValuesRepository {
    constructor(private api: D2Api) {}

    async get(options: DataValuesSelector): Async<DataValue[]> {
        const res$ = this.api.dataValues.getSet({
            dataSet: options.dataSetIds || [],
            orgUnit: options.orgUnitIds || [],
            dataElementGroup: options.dataElementGroupIds || [],
            orgUnitGroup: options.orgUnitGroupIds || [],
            period: options.periods,
            children: options.children,
            includeDeleted: options.includeDeleted,
            startDate: options.startDate,
            endDate: options.endDate,
            limit: options.limit,
        });

        const res = await res$.getData();
        return res.dataValues;
    }

    async post(options: { dataValues: DataValueToPost[] }): Async<void> {
        const { dataValues } = options;
        const res = await this.api.dataValues.postSet({ force: true }, { dataValues }).getData();
        log.debug(`POST /dataValues response: ${JSON.stringify(res.importCount)}`);

        if (res.status !== "SUCCESS") {
            throw new Error(`Error on post: ${JSON.stringify(res, null, 4)}`);
        }
    }

    async getAudits(options: DataValuesSelector): Async<DataValueAudit[]> {
        const res$ = this.api.audit.getDataValues({
            ds: options.dataSetIds,
            ou: options.orgUnitIds,
            pe: options.periods,
            pageSize: 1e6,
        });

        const res = await res$.getData();
        return res.objects;
    }
}
