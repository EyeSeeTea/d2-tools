import _ from "lodash";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { ProgramExport } from "domain/entities/ProgramExport";
import { ProgramsRepository, RunRulesOptions } from "domain/repositories/ProgramsRepository";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import { promiseMap, runMetadata } from "./dhis2-utils";
import { D2ProgramRules } from "./d2-program-rules/D2ProgramRules";
import { D2Tracker } from "./D2Tracker";

type MetadataRes = { date: string } & { [k: string]: Array<{ id: string }> };

export class ProgramsD2Repository implements ProgramsRepository {
    private d2Tracker: D2Tracker;

    constructor(private api: D2Api) {
        this.d2Tracker = new D2Tracker(this.api);
    }

    async export(options: { ids: Id[]; orgUnitIds: Id[] | undefined }): Async<ProgramExport> {
        const { ids: programIds, orgUnitIds } = options;
        const metadata = await this.getMetadata(programIds);

        const getOptions = { programIds, orgUnitIds };
        const events = await this.d2Tracker.getFromTracker<object>("events", getOptions);
        const enrollments = await this.d2Tracker.getFromTracker<D2Enrollment>("enrollments", getOptions);
        const trackedEntities = await this.d2Tracker.getFromTracker<D2TrackedEntity>(
            "trackedEntities",
            getOptions
        );

        /* Remove redundant enrollments info from TEIs */
        const trackedEntitiesWithoutEnrollments = trackedEntities.map(trackedEntity => ({
            ...trackedEntity,
            enrollments: [],
        }));

        return {
            metadata,
            data: {
                events,
                enrollments: enrollments,
                trackedEntities: trackedEntitiesWithoutEnrollments,
            },
        };
    }

    private async getMetadata(programIds: string[]) {
        log.info(`Get metadata: program IDS: ${programIds.join(", ")}`);

        const responses = await promiseMap(programIds, programId =>
            this.api.get<MetadataRes>(`/programs/${programId}/metadata.json`).getData()
        );

        const keys = _(responses).flatMap(_.keys).uniq().difference(["date"]).value();
        const metadata = _(keys)
            .map(key => {
                const value = _(responses)
                    .flatMap(res => res[key] || [])
                    .uniqBy(obj => obj.id)
                    .value();

                return [key, value];
            })
            .fromPairs()
            .value();
        return metadata;
    }

    async import(programExport: D2ProgramExport): Async<void> {
        const metadataRes = await runMetadata(this.api.metadata.post(programExport.metadata));
        log.info(`Metadata import status: ${metadataRes.status}`);

        const { events, enrollments, trackedEntities } = programExport.data;
        const teisById = _.keyBy(trackedEntities, tei => tei.trackedEntity);

        // DHIS2 exports enrollments without attributes, but requires it on import, add from TEI
        const enrollmentsWithAttributes = enrollments.map(enrollment => ({
            ...enrollment,
            attributes: teisById[enrollment.trackedEntity]?.attributes || [],
        }));

        log.info(`Import data`);
        await this.d2Tracker.postTracker("trackedEntities", trackedEntities);
        await this.d2Tracker.postTracker("enrollments", enrollmentsWithAttributes);
        await this.d2Tracker.postTracker("events", events);
    }

    async runRules(options: RunRulesOptions): Async<void> {
        const d2ProgramRules = new D2ProgramRules(this.api);
        return d2ProgramRules.run(options);
    }
}

interface D2ProgramExport {
    metadata: object;
    data: D2ProgramData;
}

type D2ProgramData = {
    events: object[];
    enrollments: D2Enrollment[];
    trackedEntities: D2TrackedEntity[];
};

interface D2Enrollment {
    enrollment: string;
    trackedEntity: string;
}

export interface D2TrackedEntity {
    trackedEntity: Id;
    orgUnit: Id;
    trackedEntityType: Id;
    attributes: D2TeiAttribute[];
}

type D2TeiAttribute = {
    attribute: Id;
    value: string;
    storedBy: string;
};
