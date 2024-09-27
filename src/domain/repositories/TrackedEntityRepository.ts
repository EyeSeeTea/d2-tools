import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Stats } from "domain/entities/Stats";
import { TrackedEntity } from "domain/entities/TrackedEntity";

export interface TrackedEntityRepository {
    getAll(params: TrackedEntityFilterParams): Async<TrackedEntity[]>;
    save(trackedEntities: TrackedEntity[]): Async<Stats>;
}

export type TrackedEntityFilterParams = {
    programId: Id;
};
