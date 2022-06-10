import { DataValueAudit } from "@eyeseetea/d2-api/api/audit";
import { Async } from "domain/entities/Async";
import { DataValue } from "domain/entities/DataValue";
import { DataValuesRepository, DataValuesSelector } from "domain/repositories/DataValuesRepository";
import { D2Api } from "types/d2-api";

export class DataValuesD2Repository implements DataValuesRepository {
    constructor(private api: D2Api) {}

    async get(options: DataValuesSelector): Async<DataValue[]> {
        const res$ = this.api.dataValues.getSet({
            dataSet: options.dataSetIds,
            orgUnit: options.orgUnitIds,
            period: options.periods,
            includeDeleted: true,
        });

        const res = await res$.getData();
        return res.dataValues;
    }

    async getAudit(options: DataValuesSelector): Async<DataValueAudit[]> {
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
