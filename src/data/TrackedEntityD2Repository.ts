import _ from "lodash";
import { D2Api } from "types/d2-api";
import { Async } from "domain/entities/Async";

import { getInChunks } from "./dhis2-utils";
import { Stats } from "domain/entities/Stats";
import {
    TrackedEntityFilterParams,
    TrackedEntityRepository,
} from "domain/repositories/TrackedEntityRepository";
import { TrackedEntity } from "domain/entities/TrackedEntity";
import { D2TrackedEntity, ProgramsD2Repository } from "./ProgramsD2Repository";

const initialStats = {
    recordsSkipped: [],
    errorMessage: "",
    created: 0,
    ignored: 0,
    updated: 0,
};

export class TrackedEntityD2Repository implements TrackedEntityRepository {
    private programsD2Repository: ProgramsD2Repository;

    constructor(private api: D2Api) {
        this.programsD2Repository = new ProgramsD2Repository(this.api);
    }

    async getAll(params: TrackedEntityFilterParams): Async<TrackedEntity[]> {
        const trackedEntities = await this.programsD2Repository.getFromTracker<D2TrackedEntity>(
            "trackedEntities",
            {
                orgUnitIds: undefined,
                programIds: [params.programId],
            }
        );

        return trackedEntities.map(tei => {
            return {
                id: tei.trackedEntity,
                orgUnit: tei.orgUnit,
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

    async saveAttributes(teis: TrackedEntity[]): Async<Stats> {
        if (teis.length === 0)
            return { created: 0, ignored: 0, updated: 0, errorMessage: "", recordsSkipped: [] };
        const teisToFetch = teis.map(program => program.id);
        const programsIds = _(teis)
            .map(program => program.programId)
            .uniq()
            .value();

        const programsByKey = _(teis)
            .keyBy(tei => tei.id)
            .value();

        const stats = await getInChunks<Stats>(teisToFetch, async teiIds => {
            const trackedEntities = await this.programsD2Repository.getFromTracker<D2TrackedEntity>(
                "trackedEntities",
                {
                    orgUnitIds: undefined,
                    programIds: programsIds,
                    trackedEntity: teiIds.join(";"),
                }
            );

            const teisToSave = trackedEntities.map(tei => {
                const currentProgram = programsByKey[tei.trackedEntity];
                if (!currentProgram) throw Error(`Cannot find tracked entity: ${tei.trackedEntity}`);
                const attributes = currentProgram.attributes.map(attributeValue => {
                    return { ...attributeValue, attribute: attributeValue.attributeId };
                });

                return {
                    trackedEntity: currentProgram.id,
                    orgUnit: tei.orgUnit,
                    trackedEntityType: tei.trackedEntityType,
                    attributes,
                };
            });

            const response = await this.programsD2Repository.postTracker("trackedEntities", teisToSave);

            return _(response)
                .map(item => {
                    const isError = item.status === "ERROR";
                    return {
                        created: item.stats.created,
                        updated: item.stats.updated,
                        ignored: item.stats.ignored,
                        errorMessage: isError ? item.status : "",
                        recordsSkipped: isError ? teisToSave.map(tei => tei.trackedEntity) : [],
                    };
                })
                .value();
        });

        return stats.reduce((acum, stat) => {
            return {
                recordsSkipped: [...acum.recordsSkipped, ...stat.recordsSkipped],
                errorMessage: `${acum.errorMessage}${stat.errorMessage}`,
                created: acum.created + stat.created,
                ignored: acum.ignored + stat.ignored,
                updated: acum.updated + stat.updated,
            };
        }, initialStats);
    }
}
