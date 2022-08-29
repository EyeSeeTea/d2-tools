import _ from "lodash";
import fs from "fs";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { ProgramExport } from "domain/entities/ProgramExport";
import { ProgramsRepository, RunRulesOptions } from "domain/repositories/ProgramsRepository";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import { promiseMap, runMetadata } from "./dhis2-utils";
import { D2ProgramRules } from "./d2-program-rules/D2ProgramRules";

type MetadataRes = { date: string } & { [k: string]: Array<{ id: string }> };

type TrackerDataKey = "events" | "enrollments" | "trackedEntities";

export class ProgramsD2Repository implements ProgramsRepository {
    constructor(private api: D2Api) {}

    async export(options: { ids: Id[] }): Async<ProgramExport> {
        const programIds = options.ids;
        const metadata = await this.getMetadata(programIds);

        const events = await this.getFromTracker<object>("events", { programIds });
        const enrollments = await this.getFromTracker<D2Enrollment>("enrollments", { programIds });
        const trackedEntities = await this.getFromTracker<D2TrackedEntity>("trackedEntities", { programIds });

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

    async import(programExport: ProgramExport): Async<void> {
        const metadataRes = await runMetadata(this.api.metadata.post(programExport.metadata));
        log.info(`Metadata import status: ${metadataRes.status}`);

        const { events, enrollments, trackedEntities } = programExport.data as D2ProgramData;
        const teisById = _.keyBy(trackedEntities, tei => tei.trackedEntity);

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

    /* Private */

    private async postTracker(key: TrackerDataKey, objects: object[]) {
        const total = objects.length;
        log.info(`Import data: ${key} - Total: ${total}`);
        let page = 1;
        const chunkSize = 100;

        for (const objectsGroup of _.chunk(objects, chunkSize)) {
            const initial = (page - 1) * chunkSize;
            log.debug(`Import data (${objectsGroup.length}): ${key} (offset: ${initial})`);
            await this.postTrackerData({ [key]: objectsGroup }, { payloadId: `${key}-${initial}` });
            page++;
        }
    }

    private async postTrackerData(data: object, options: { payloadId: string }): Async<TrackerResponse> {
        const response: TrackerResponse = await this.api
            .post<TrackerResponse>("/tracker", { async: false }, data)
            .getData()
            .catch(err => {
                if (err?.response?.data) {
                    return err.response.data as TrackerResponse;
                } else {
                    return { status: "ERROR", typeReports: [] };
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
        options: { programIds: string[]; orgUnitIds?: string[]; fields?: string }
    ): Promise<T[]> {
        const output = [];
        const { programIds, orgUnitIds, fields = "*" } = options;

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

type TrackerResponse = { status: string; typeReports: object[] };

export interface D2ProgramExport {
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
    trackedEntity: string;
    attributes: object[];
}
