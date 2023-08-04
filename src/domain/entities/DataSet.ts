import { Id, NamedRef, Ref } from "./Base";

export interface DataSetToCompare {
    id: Id;
    name: string;
    validCompleteOnly: boolean;
    dataElementDecoration: boolean;
    notifyCompletingUser: boolean;
    noValueRequiresComment: boolean;
    skipOffline: boolean;
    compulsoryFieldsCompleteOnly: boolean;
    fieldCombinationRequired: boolean;
    renderHorizontally: boolean;
    renderAsTabs: boolean;
    mobile: boolean;
    openPeriodsAfterCoEndDate: number;
    timelyDays: number;
    periodType: string;
    openFuturePeriods: number;
    expiryDays: number;
    categoryCombo: Ref;
    workflow: Ref;
    dataSetElements: Array<{ dataElement: Ref; categoryCombo?: Ref; dataSet: Ref }>;
    dataInputPeriods: Array<{ openingDate: string; closingDate: string; period: { id: string } }>;
    organisationUnits: Ref[];
    attributeValues: Array<{ value: string; attribute: Ref }>;
    indicators: Ref[];
    legendSets: Ref[];
    userAccesses: Array<{ access: string; id: Id }>;
    userGroupAccesses: Array<{ access: string; id: Id }>;
    sections: Array<{
        sortOrder: number;
        description: string;
        showRowTotals: boolean;
        showColumnTotals: boolean;
        greyedFields: Array<{ dataElement: Ref; categoryOptionCombo: Ref }>;
        dataElements: Ref[];
        indicators: Ref[];
    }>;
}

export interface DataSetMetadata {
    dataSets: DataSet[];
}

export interface DataSet {
    id: Id;
    name: string;
    code: string;
    categoryCombo: CategoryCombo;
    dataSetElements: Array<{
        dataElement: DataSetDataElement;
        categoryCombo?: CategoryCombo;
    }>;
    dataInputPeriods: Array<{ period: { id: string } }>;
    organisationUnits: NamedRef[];
}

interface CategoryCombo {
    id: Id;
    categoryOptionCombos: Ref[];
}

export interface DataSetDataElement {
    id: Id;
    name: string;
    categoryCombo: CategoryCombo;
}
