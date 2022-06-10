import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { DataValue } from "domain/entities/DataValue";
import { DataValueAudit } from "domain/entities/DataValueAudit";

export interface DataValuesRepository {
    get(options: DataValuesSelector): Async<DataValue[]>;
    getAudit(options: DataValuesSelector): Async<DataValueAudit[]>;
}

export interface DataValuesSelector {
    dataSetIds: Id[];
    orgUnitIds: Id[];
    periods: string[];
}
