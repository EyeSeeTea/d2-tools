import _ from "lodash";
import { D2Api } from "types/d2-api";
import { Async } from "domain/entities/Async";

import { getInChunks } from "./dhis2-utils";
import { Stats } from "domain/entities/Stats";
import {
    TrackedEntityFilterParams,
    TrackedEntityRepository,
} from "domain/repositories/TrackedEntityRepository";
import { Enrollment, TrackedEntity } from "domain/entities/TrackedEntity";
import { D2Tracker } from "./D2Tracker";
import { D2EventsMapper } from "./ProgramEventsD2Repository";

export class TrackedEntityD2Repository implements TrackedEntityRepository {
    private d2Tracker: D2Tracker;

    constructor(private api: D2Api) {
        this.d2Tracker = new D2Tracker(this.api);
    }

    async getAll(params: TrackedEntityFilterParams): Async<TrackedEntity[]> {
        const trackedEntities = await this.d2Tracker.getFromTracker("trackedEntities", {
            orgUnitIds: undefined,
            programIds: [params.programId],
        });

        const d2EventsMapper = await D2EventsMapper.build(this.api);

        return trackedEntities.map(tei => {
            return {
                id: tei.trackedEntity,
                orgUnit: tei.orgUnit,
                enrollments: tei.enrollments.map(
                    (enrollment): Enrollment => ({
                        id: enrollment.enrollment,
                        orgUnit: { id: enrollment.orgUnit, name: enrollment.orgUnitName },
                        events: enrollment.events.map(event =>
                            d2EventsMapper.getEventEntityFromD2Object(event)
                        ),
                    })
                ),
                trackedEntityType: tei.trackedEntityType,
                attributes: tei.attributes.map(attribute => {
                    return {
                        attributeId: attribute.attribute,
                        value: attribute.value,
                        storedBy: attribute.storedBy,
                    };
                }),
                programId: params.programId,
            };
        });
    }

    async save(trackedEntities: TrackedEntity[]): Async<Stats> {
        if (trackedEntities.length === 0) return Stats.empty();
        const teisToFetch = trackedEntities.map(program => program.id);
        const programsIds = _(trackedEntities)
            .map(program => program.programId)
            .uniq()
            .value();

        const programsByKey = _(trackedEntities)
            .keyBy(tei => tei.id)
            .value();

        const stats = await getInChunks<Stats>(teisToFetch, async teiIds => {
            const trackedEntities = await this.d2Tracker.getFromTracker("trackedEntities", {
                orgUnitIds: undefined,
                programIds: programsIds,
                trackedEntity: teiIds.join(";"),
            });

            const teisToSave = trackedEntities.map(tei => {
                const currentProgram = programsByKey[tei.trackedEntity];
                if (!currentProgram) throw Error(`Cannot find tracked entity: ${tei.trackedEntity}`);
                const attributes = currentProgram.attributes.map(attributeValue => {
                    return { ...attributeValue, attribute: attributeValue.attributeId };
                });

                return {
                    ...tei,
                    trackedEntity: currentProgram.id,
                    orgUnit: tei.orgUnit,
                    trackedEntityType: tei.trackedEntityType,
                    attributes,
                };
            });

            const response = await this.d2Tracker.postTracker("trackedEntities", teisToSave);

            return _(response)
                .map(item => {
                    return new Stats({
                        created: item.stats.created,
                        updated: item.stats.updated,
                        ignored: item.stats.ignored,
                        deleted: item.stats.deleted,
                        total: item.stats.total,
                        recordsSkipped: [],
                        errorMessage: "",
                    });
                })
                .value();
        });

        return Stats.combine(stats);
    }
}
