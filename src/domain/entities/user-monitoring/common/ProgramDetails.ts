export interface ProgramDetails {
    id: string;
    programStageId: string;
    dataElements: DataElement[];
    orgUnitId: string;
}

export interface DataElement {
    id: string;
    code: string;
    name: string;
}
