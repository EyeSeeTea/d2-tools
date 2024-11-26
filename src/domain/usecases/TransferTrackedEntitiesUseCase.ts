import { Async } from "domain/entities/Async";
import { TrackedEntityTransfer } from "domain/entities/TrackedEntity";
import { TrackedEntityRepository } from "domain/repositories/TrackedEntityRepository";

export class TransferTrackedEntitiesUseCase {
    constructor(private trackedEntityRepository: TrackedEntityRepository) {}

    execute(trackedEntityTransfers: TrackedEntityTransfer[], options: { post: boolean }): Async<void> {
        return this.trackedEntityRepository.transfer(trackedEntityTransfers, options);
    }
}
