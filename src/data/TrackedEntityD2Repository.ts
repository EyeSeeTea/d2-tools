import _ from "lodash";
import { D2Api } from "types/d2-api";
import { Async } from "domain/entities/Async";
import logger from "utils/log";

import { getInChunks } from "./dhis2-utils";
import { Stats } from "domain/entities/Stats";
import {
    TrackedEntityFilterParams,
    TrackedEntityRepository,
} from "domain/repositories/TrackedEntityRepository";
import { Enrollment, TrackedEntity } from "domain/entities/TrackedEntity";
import { D2Tracker } from "./D2Tracker";
import { D2EventsMapper } from "./ProgramEventsD2Repository";
import { TrackedEntityTransfer } from "domain/entities/TrackedEntity";
import { TrackedEntityInstance } from "@eyeseetea/d2-api/api/trackedEntityInstances";

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

        const stats = await getInChunks<string, Stats>(teisToFetch, async teiIds => {
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

    async transfer(transfers: TrackedEntityTransfer[], options: { post: boolean }): Async<void> {
        const teis = await this.getTeisFromTransfers(transfers);
        const teisWithChanges = this.getTeisWithChanges(transfers, teis);
        this.transferTeis(teisWithChanges, options);
    }

    private async transferTeis(teis: TrackedEntityInstance[], options: { post: boolean }) {
        const { api } = this;

        if (!options.post) {
            logger.info(`Add --post to update tracked entities`);
            return;
        }

        logger.info(`Transfer ownership: ${teis.length}`);

        for (const tei of teis) {
            await this.transferTei(tei);
        }

        await this.postTeis(teis, api);
    }

    private async transferTei(tei: TrackedEntityInstance) {
        const programId = tei.enrollments[0]?.program;

        if (!programId) {
            logger.warn(`Tei without enrollments: ${tei.trackedEntityInstance}`);
            return;
        }

        logger.debug(`Transfer ownership: trackedEntity.id=${tei.trackedEntityInstance}`);

        const res = await this.api
            .put<{ status: string }>(
                `tracker/ownership/transfer?trackedEntityInstance=${tei.trackedEntityInstance}&ou=${tei.orgUnit}&program=${programId}`
            )
            .getData();

        if (res.status !== "OK") {
            logger.error(`Transfer ownership failed: ${JSON.stringify(res)}`);
        }
    }

    private async postTeis(teis: TrackedEntityInstance[], api: D2Api) {
        logger.info(`Import trackedEntities: ${teis.length}`);
        const res = await api.trackedEntityInstances.post({}, { trackedEntityInstances: teis }).getData();
        logger.info(`Tracked entities updated: ${res.status} - updated=${res.updated}`);
    }

    private getTeisWithChanges(transfers: TrackedEntityTransfer[], teis: TrackedEntityInstance[]) {
        const rowsByTeiId = _.keyBy(transfers, row => row.trackedEntityId);

        const teis2 = _(teis)
            .sortBy(tei => tei.trackedEntityInstance)
            .map(tei => {
                const row = rowsByTeiId[tei.trackedEntityInstance];
                if (!row) throw new Error("internal");
                const orgUnitId = row.newOrgUnitId;
                if (!orgUnitId) throw new Error("internal");
                const hasChanges = tei.orgUnit !== orgUnitId;

                return hasChanges ? { ...tei, orgUnit: orgUnitId } : undefined;
            })
            .compact()
            .value();

        logger.info(`trackedEntities that need to be transfered: ${teis2.length}`);
        return teis2;
    }

    private async getTeisFromTransfers(transfers: TrackedEntityTransfer[]) {
        logger.debug(`Get trackedEntities: ${transfers.length}`);

        const teis = await getInChunks(transfers, async rowsChunk => {
            const res = await this.api.trackedEntityInstances
                .getAll({
                    totalPages: true,
                    ouMode: "ALL",
                    trackedEntityInstance: rowsChunk.map(row => row.trackedEntityId).join(";"),
                })
                .getData();

            return res.trackedEntityInstances;
        });

        logger.debug(`trackedEntities from server: ${teis.length}`);

        return teis;
    }
}
