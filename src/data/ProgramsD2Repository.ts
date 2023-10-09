import _ from "lodash";
import fs from "fs";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { ProgramExport } from "domain/entities/ProgramExport";
import {
    MoveProgramAttributeOptions,
    ProgramsRepository,
    RunRulesOptions,
} from "domain/repositories/ProgramsRepository";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import { getInChunks, promiseMap, runMetadata } from "./dhis2-utils";
import { D2ProgramRules } from "./d2-program-rules/D2ProgramRules";
import { Stats } from "domain/entities/Stats";
import { ProgramAttributes } from "domain/entities/ProgramAttributes";

type MetadataRes = { date: string } & { [k: string]: Array<{ id: string }> };

type TrackerDataKey = "events" | "enrollments" | "trackedEntities";

const initialStats = {
    recordsSkipped: [],
    errorMessage: "",
    created: 0,
    ignored: 0,
    updated: 0,
};

export class ProgramsD2Repository implements ProgramsRepository {
    constructor(private api: D2Api) {}

    async export(options: { ids: Id[]; orgUnitIds: Id[] | undefined }): Async<ProgramExport> {
        const { ids: programIds, orgUnitIds } = options;
        const metadata = await this.getMetadata(programIds);

        const getOptions = { programIds, orgUnitIds };
        const events = await this.getFromTracker<object>("events", getOptions);
        const enrollments = await this.getFromTracker<D2Enrollment>("enrollments", getOptions);
        const trackedEntities = await this.getFromTracker<D2TrackedEntity>("trackedEntities", getOptions);

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
        await this.postTracker("trackedEntities", trackedEntities);
        await this.postTracker("enrollments", enrollmentsWithAttributes);
        await this.postTracker("events", events);
    }

    async runRules(options: RunRulesOptions): Async<void> {
        const d2ProgramRules = new D2ProgramRules(this.api);
        return d2ProgramRules.run(options);
    }

    async getAll(options: MoveProgramAttributeOptions): Async<ProgramAttributes[]> {
        const trackedEntities = await this.getFromTracker<D2TrackedEntity>("trackedEntities", {
            orgUnitIds: undefined,
            programIds: [options.programId],
        });

        return trackedEntities.map(tei => {
            return {
                id: tei.trackedEntity,
                orgUnit: tei.orgUnit,
                trackedEntityType: tei.trackedEntityType,
                attributes: tei.attributes.map(attribute => {
                    return {
                        attribute: attribute.attribute,
                        value: attribute.value,
                        storedBy: attribute.storedBy,
                    };
                }),
                programId: options.programId,
            };
        });
    }

    async saveAttributes(programs: ProgramAttributes[]): Async<Stats> {
        if (programs.length === 0)
            return { created: 0, ignored: 0, updated: 0, errorMessage: "", recordsSkipped: [] };
        const teisToFetch = programs.map(program => program.id);
        const programsIds = _(programs)
            .map(program => program.programId)
            .uniq()
            .value();

        const programsByKey = _(programs)
            .keyBy(tei => tei.id)
            .value();

        const stats = await getInChunks<Stats>(teisToFetch, async teiIds => {
            const trackedEntities = await this.getFromTracker<D2TrackedEntity>("trackedEntities", {
                orgUnitIds: undefined,
                programIds: programsIds,
                trackedEntity: teiIds.join(";"),
            });

            const teisToSave = trackedEntities.map(tei => {
                const currentProgram = programsByKey[tei.trackedEntity];
                if (!currentProgram) throw Error(`Cannot find program: ${tei.trackedEntity}`);
                const attributes = currentProgram?.attributes || tei.attributes;

                return {
                    trackedEntity: currentProgram?.id,
                    orgUnit: tei.orgUnit,
                    trackedEntityType: tei.trackedEntityType,
                    attributes,
                };
            });

            const response = await this.postTracker("trackedEntities", teisToSave);

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

    /* Private */

    private async postTracker(key: TrackerDataKey, objects: object[]): Async<TrackerResponse[]> {
        const total = objects.length;
        log.info(`Import data: ${key} - Total: ${total}`);
        let page = 1;
        const chunkSize = 100;
        const result = [];

        for (const objectsGroup of _.chunk(objects, chunkSize)) {
            const initial = (page - 1) * chunkSize;
            log.debug(`Import data (${objectsGroup.length}): ${key} (offset: ${initial})`);
            const trackerResponse = await this.postTrackerData(
                { [key]: objectsGroup },
                { payloadId: `${key}-${initial}` }
            );
            result.push(trackerResponse);
            page++;
        }
        return result;
    }

    private async postTrackerData(data: object, options: { payloadId: string }): Async<TrackerResponse> {
        const response: TrackerResponse = await this.api
            .post<TrackerResponse>("/tracker", { async: false }, data)
            .getData()
            .catch(err => {
                if (err?.response?.data) {
                    return err.response.data as TrackerResponse;
                } else {
                    return {
                        status: "ERROR",
                        typeReports: [],
                        stats: initialStats,
                    };
                }
            });
        log.debug(`Status: ${response.status}`);

        if (response.status !== "OK") {
            const errorJsonPath = `programs-import-error-${options.payloadId}.json`;
            log.error(`Save import error: ${errorJsonPath}`);
            fs.writeFileSync(errorJsonPath, JSON.stringify({ response, data }, null, 4));
            return response;
        } else {
            return response;
        }
    }

    private async getFromTracker<T>(
        apiPath: string,
        options: {
            programIds: string[];
            orgUnitIds: string[] | undefined;
            fields?: string;
            trackedEntity?: string | undefined;
        }
    ): Promise<T[]> {
        const output = [];
        const { programIds, orgUnitIds, fields = "*", trackedEntity } = options;

        for (const programId of programIds) {
            let page = 1;
            let dataRemaining = true;

            while (dataRemaining) {
                const pageSize = 1000;
                log.debug(`GET ${apiPath} (pageSize=${pageSize}, page=${page})`);

                const { instances } = await this.api
                    .get<{ instances: T[] }>(`/tracker/${apiPath}`, {
                        page,
                        pageSize: pageSize,
                        ouMode: orgUnitIds ? "SELECTED" : "ALL",
                        orgUnit: orgUnitIds?.join(";"),
                        fields: fields,
                        program: programId,
                        trackedEntity,
                    })
                    .getData();

                if (instances.length === 0) {
                    dataRemaining = false;
                } else {
                    output.push(...instances);
                    page++;
                }
            }
        }
        log.info(`GET ${apiPath} -> Total: ${output.length}`);

        return output;
    }
}

type TrackerResponse = {
    status: string;
    typeReports: object[];
    stats: Stats;
};

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

interface D2TrackedEntity {
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
