export interface DataSet {
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

type Id = string;

type Ref = { id: Id };
