import { OrgUnit } from "domain/entities/OrgUnit";
import { Program } from "domain/entities/Program";
import { TrackedEntity } from "domain/entities/TrackedEntity";
import { DataValue } from "domain/entities/DataValue";
import { Event } from "domain/entities/enrollments/Event";
import { Id } from "./Base";

export type DataReport = {
    dataValues: DataValue[];
    orgUnits: OrgUnit[];
    programs: Program[];
    nonTrackerEvents: Event[];
    trackedEntities: TrackedEntity[];
    dataValuesAppUrl: Url;
    programDataAppUrl: (options: { programId: Id; orgUnitId: Id }) => Url;
};

type Url = string;
