import _ from "lodash";
import { Async } from "domain/entities/Async";
import { getId, Id } from "domain/entities/Base";
import { ProgramExport } from "domain/entities/ProgramExport";
import { ProgramsRepository, RunRulesOptions } from "domain/repositories/ProgramsRepository";
import {
    D2Api,
    D2TrackedEntityInstanceToPost,
    D2TrackerEnrollmentToPost,
    D2TrackerEventToPost,
} from "types/d2-api";
import log from "utils/log";
import { promiseMap, runMetadata } from "./dhis2-utils";
import { D2ProgramRules } from "./d2-program-rules/D2ProgramRules";
import { D2Tracker } from "./D2Tracker";
import { Program, ProgramType } from "domain/entities/Program";

type MetadataRes = { date: string } & { [k: string]: Array<{ id: string }> };

export class ProgramsD2Repository implements ProgramsRepository {
    private d2Tracker: D2Tracker;

    constructor(private api: D2Api) {
        this.d2Tracker = new D2Tracker(this.api);
    }

    async get(options: { ids?: Id[]; programTypes?: ProgramType[] }): Async<Program[]> {
        const { programs } = await this.api.metadata
            .get({
                programs: {
                    fields: {
                        id: true,
                        name: true,
                        programType: true,
                        version: true,
                        programStages: {
                            id: true,
                            name: true,
                            programStageDataElements: {
                                dataElement: {
                                    id: true,
                                    name: true,
                                    code: true,
                                    valueType: true,
                                    optionSet: { id: true, name: true },
                                },
                                displayInReports: true,
                            },
                        },
                    },
                    filter: {
                        ...(options.ids ? { id: { in: options.ids } } : {}),
                        ...(options.programTypes ? { programType: { in: options.programTypes } } : {}),
                        ...(options.ids ? { id: { in: options.ids } } : {}),
                    },
                },
            })
            .getData();

        return programs;
    }

    async save(programs: Program[]): Async<void> {
        // The Program entity is a partial view of the D2 model, so the changed fields must be
        // merged over the stored object: the metadata import uses mergeMode=REPLACE and would
        // drop everything missing from the payload.
        const { programs: programsExisting } = await this.api.metadata
            .get({
                programs: {
                    fields: { $owner: true },
                    filter: { id: { in: programs.map(getId) } },
                },
            })
            .getData();

        const payload: object = { programs: mergeProgramsWithExisting(programsExisting, programs) };
        const res = await runMetadata(this.api.metadata.post(payload));
        log.info(`Save programs (${programs.length}): ${res.status}`);
    }

    async export(options: { ids: Id[]; orgUnitIds: Id[] | undefined }): Async<ProgramExport> {
        const { ids: programIds, orgUnitIds } = options;
        const metadata = await this.getMetadata(programIds);

        const getOptions = { programIds, orgUnitIds };
        const events = await this.d2Tracker.getFromTracker("events", getOptions);
        const enrollments = await this.d2Tracker.getFromTracker("enrollments", getOptions);
        const trackedEntities = await this.d2Tracker.getFromTracker("trackedEntities", getOptions);

        /* Remove redundant enrollments info from TEIs */
        const trackedEntitiesWithoutEnrollments = trackedEntities.map(trackedEntity => ({
            ...trackedEntity,
            enrollments: [],
        }));

        return {
            metadata,
            data: {
                events: events,
                enrollments: enrollments,
                trackedEntities: trackedEntitiesWithoutEnrollments,
            },
        };
    }

    getAppUrl(options: { programId: string; orgUnitId: string }): string {
        return (
            `${this.api.baseUrl}/dhis-web-capture/index.html#/?` +
            `programId=${options.programId}&orgUnitId=${options.orgUnitId}`
        );
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
            attributes: (enrollment.trackedEntity && teisById[enrollment.trackedEntity]?.attributes) || [],
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

/* Fields the Program entity owns and may write back. Everything else in the payload (including
   the nested collections, which the entity holds only as a partial view) comes from the stored
   object, as returned by the :owner preset. */
const programWritableFields = ["name", "programType", "version"] as const;

export function mergeProgramsWithExisting(programsExisting: D2ProgramOwner[], programs: Program[]): object[] {
    const existingById = _.keyBy(programsExisting, program => program.id);

    return _(programs)
        .map(program => {
            const programExisting = existingById[program.id];

            if (!programExisting) {
                log.warn(`Cannot find program: ${program.id}`);
                return undefined;
            } else {
                return { ...programExisting, ..._.pick(program, programWritableFields) };
            }
        })
        .compact()
        .value();
}

export interface D2ProgramOwner {
    id: Id;
}

interface D2ProgramExport {
    metadata: object;
    data: D2ProgramData;
}

type D2ProgramData = {
    events: D2TrackerEventToPost[];
    enrollments: D2TrackerEnrollmentToPost[];
    trackedEntities: D2TrackedEntityInstanceToPost[];
};

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
