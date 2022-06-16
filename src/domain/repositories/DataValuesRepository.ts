import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { DataValue, DataValueToPost } from "domain/entities/DataValue";
import { DataValueAudit } from "domain/entities/DataValueAudit";

export interface DataValuesRepository {
    get(options: DataValuesSelector): Async<DataValue[]>;
    post(options: { dataValues: DataValueToPost[] }): Async<void>;
    getAudits(options: DataValueAuditsSelector): Async<DataValueAudit[]>;
}

export interface DataValuesSelector {
    dataSetIds?: Id[];
    orgUnitIds?: Id[];
    periods?: string[];
    dataElementGroupIds?: Id[];
    orgUnitGroupIds?: Id[];
    children?: boolean;
    includeDeleted: boolean;
    startDate?: string;
    endDate?: string;
    limit?: number;
}

export type DataValueAuditsSelector = Pick<DataValuesSelector, "dataSetIds" | "orgUnitIds" | "periods">;
