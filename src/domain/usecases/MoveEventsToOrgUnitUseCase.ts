import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { ProgramEventToSave } from "domain/entities/ProgramEvent";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import logger from "utils/log";
import { Maybe } from "utils/ts-utils";

export class MoveEventsToOrgUnitUseCase {
    constructor(private programEventsRepository: ProgramEventsRepository) {}

    async execute(options: Options): Async<void> {
        const events = await this.programEventsRepository.get({
            programIds: options.programIds,
            orgUnitsIds: [options.fromOrgUnitId],
        });

        logger.info(`Events in orgUnit ${options.fromOrgUnitId}: ${events.length}`);

        const eventsUpdated = events.map(
            (ev): ProgramEventToSave => ({ ...ev, orgUnit: { id: options.toOrgUnitId } })
        );

        if (options.post) {
            logger.info(`Post updated events to orgUnit: ${options.toOrgUnitId}`);
            const res = await this.programEventsRepository.save(eventsUpdated);
            if (res.type === "error") throw new Error(res.message);
        }
    }
}

interface Options {
    programIds: Maybe<Id[]>;
    fromOrgUnitId: Id;
    toOrgUnitId: Id;
    post: boolean;
}
