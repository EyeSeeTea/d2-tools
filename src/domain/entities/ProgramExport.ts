export interface ProgramExport {
    metadata: {
        programs: Program[];
    };
    data: ProgramData;
}

type Program = object;
type ProgramData = {
    events: object[];
    enrollments: object[];
    trackedEntities: object[];
};
