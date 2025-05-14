import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Stats } from "domain/entities/Stats";
import { TrackedEntity, TrackedEntityTransfer } from "domain/entities/TrackedEntity";

export interface TrackedEntityRepository {
    getAll(params: TrackedEntityFilterParams): Async<TrackedEntity[]>;
    save(trackedEntities: TrackedEntity[]): Async<Stats>;
    transfer(trackedEntities: TrackedEntityTransfer[], options: { post: boolean }): Async<void>;
}

export type TrackedEntityFilterParams = {
    programId: Id;
    orgUnitIds?: Id[];
    children?: boolean;
};
