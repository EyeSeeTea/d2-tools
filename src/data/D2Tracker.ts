import _ from "lodash";
import fs from "fs";

import { Async } from "domain/entities/Async";
import { Stats } from "domain/entities/Stats";
import {
    D2Api,
    TrackedEntitiesGetResponse,
    TrackerEnrollmentsResponse,
    TrackerEventsResponse,
    TrackerPostRequest,
} from "types/d2-api";
import log from "utils/log";

export class D2Tracker {
    constructor(private api: D2Api) {}

    async postTracker<Key extends TrackerDataKey>(
        key: Key,
        objects: Array<NonNullable<TrackerPostRequest[Key]>[number]>
    ): Async<TrackerResponse[]> {
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

    private async postTrackerData(
        data: TrackerPostRequest,
        options: { payloadId: string }
    ): Async<TrackerResponse> {
        const response: TrackerResponse = await this.api.tracker
            .post({ async: false }, data)
            .getData()
            .then(res => ({ ...res, stats: { ...Stats.empty(), ...res.stats } }))
            .catch((err): TrackerResponse => {
                const data = err?.response?.data;
                if (data) {
                    return data;
                } else {
                    return {
                        status: "ERROR",
                        stats: Stats.empty(),
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

    async getFromTracker<Key extends TrackerDataKey>(
        model: Key,
        options: {
            programIds: string[];
            orgUnitIds: string[] | undefined;
            trackedEntity?: string | undefined;
            children?: boolean;
        }
    ): Promise<Array<Mapping[Key][number]>> {
        type Output = Array<Mapping[Key][number]>;

        const output: Output = [];
        const { programIds, orgUnitIds, trackedEntity } = options;

        for (const programId of programIds) {
            let page = 1;
            let dataRemaining = true;

            while (dataRemaining) {
                const pageSize = 1000;
                log.debug(`GET ${model} (program=${programId}, pageSize=${pageSize}, page=${page})`);

                const ouMode = orgUnitIds ? (options.children ? "DESCENDANTS" : "SELECTED") : "ALL";

                const apiOptions = {
                    page: page,
                    pageSize: pageSize,
                    ouMode: ouMode as typeof ouMode,
                    orgUnit: orgUnitIds?.join(";"),
                    fields: { $all: true } as const,
                    program: programId,
                    trackedEntity,
                };

                const { tracker } = this.api;

                const endpoint = {
                    trackedEntities: () => tracker.trackedEntities.get(apiOptions),
                    enrollments: () => tracker.enrollments.get(apiOptions),
                    events: () => tracker.events.get(apiOptions),
                };

                const res = await endpoint[model]().getData();
                const instances: Output = res.instances as Output;

                if (instances.length === 0) {
                    dataRemaining = false;
                } else {
                    output.push(...instances);
                    page++;
                }
            }
        }
        log.info(`GET ${model} -> Total: ${output.length}`);

        return output;
    }
}

type TrackerResponse = {
    status: string;
    stats: Stats;
};

type TrackerDataKey = "events" | "enrollments" | "trackedEntities";

type Mapping = {
    trackedEntities: TrackedEntitiesGetResponse<{ $all: true }>["instances"];
    enrollments: TrackerEnrollmentsResponse<{ $all: true }>["instances"];
    events: TrackerEventsResponse<{ $all: true }>["instances"];
};
