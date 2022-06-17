import { PartialBy } from "utils/ts-utils";
import { Id, NamedRef } from "./Base";
import { DateTimeIso8601 } from "./DateTime";

export interface DataValue {
    dataElement: Id;
    period: Period;
    orgUnit: Id;
    categoryOptionCombo: Id;
    attributeOptionCombo: Id;
    value: string;
    storedBy: Username;
    created: DateTimeIso8601;
    lastUpdated: DateTimeIso8601;
    followup: boolean;
    deleted?: boolean;
}

export type DataValueToPost = PartialBy<
    DataValue,
    "storedBy" | "created" | "lastUpdated" | "followup" | "deleted"
>;

type Period = string;
type Username = string;

type IdField = "dataElement" | "period" | "orgUnit" | "categoryOptionCombo" | "attributeOptionCombo";

export type DataValueIdentifiable = Pick<DataValue, IdField>;

export function getDataValueId(dataValue: DataValueIdentifiable): string {
    const parts = [
        dataValue.dataElement,
        dataValue.period,
        dataValue.orgUnit,
        dataValue.attributeOptionCombo,
        dataValue.categoryOptionCombo,
    ];

    return parts.join(".");
}

export function formatDataValue(dataValue: DataValue): string {
    const parts = [
        ["storedBy", dataValue.storedBy],
        ["lastUpdated", dataValue.lastUpdated],
        ["dataElement", dataValue.dataElement],
        ["period", dataValue.period],
        ["orgUnit", dataValue.orgUnit],
        ["aoc", dataValue.attributeOptionCombo],
        ["coc", dataValue.categoryOptionCombo],
        ["value", dataValue.value],
    ];

    return parts.map(([name, value]) => `${name}=${value}`).join(" ");
}

type IndexedById<T> = Record<Id, T>;

export interface DataValuesMetadata {
    dataElements: IndexedById<NamedRef>;
    categoryOptionCombos: IndexedById<NamedRef>;
    orgUnits: IndexedById<NamedRef>;
}
