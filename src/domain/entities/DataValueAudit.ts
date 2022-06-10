import { Ref, Username } from "./Base";
import { DataValueIdentifiable, getDataValueId } from "./DataValue";
import { DateTimeIso8601 } from "./DateTime";

export interface DataValueAudit {
    created: DateTimeIso8601;
    modifiedBy: Username;
    auditType: "UPDATE" | "DELETE";
    value: string;
    period: Ref;
    organisationUnit: Ref;
    attributeOptionCombo: Ref;
    categoryOptionCombo: Ref;
    dataElement: Ref;
}

export function getDataValueIdForAudit(dataValueAudit: DataValueAudit): string {
    return getDataValueId(getDataValueFromAudit(dataValueAudit));
}

export function getDataValueFromAudit(dataValueAudit: DataValueAudit): DataValueIdentifiable {
    const dva = dataValueAudit;
    return {
        dataElement: dva.dataElement.id,
        period: dva.period.id,
        orgUnit: dva.organisationUnit.id,
        attributeOptionCombo: dva.attributeOptionCombo.id,
        categoryOptionCombo: dva.categoryOptionCombo.id,
    };
}

export function formatDataValueAudit(dataValueAudit: DataValueAudit): string {
    const dva = dataValueAudit;

    const parts = [
        ["created", dva.created],
        ["modifiedBy", dva.modifiedBy],
        ["audityType", dva.auditType],
        ["dataElement", dva.dataElement.id],
        ["period", dva.period.id],
        ["orgUnit", dva.organisationUnit.id],
        ["aoc", dva.attributeOptionCombo.id],
        ["coc", dva.categoryOptionCombo.id],
        ["value", dva.value],
    ];

    return parts.map(([name, value]) => `${name}=${value}`).join(" ");
}
