export interface ProgramExport {
    metadata: object;
    data: ProgramData;
}

type ProgramData = {
    events: object[];
    enrollments: object[];
    trackedEntities: object[];
};
