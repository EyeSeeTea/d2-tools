import _ from "lodash";
import fs from "fs";

import { Async } from "domain/entities/Async";
import { Stats } from "domain/entities/Stats";
import { D2Api } from "types/d2-api";
import log from "utils/log";

export class D2Tracker {
    constructor(private api: D2Api) {}

    async postTracker(key: TrackerDataKey, objects: object[]): Async<TrackerResponse[]> {
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

    async postTrackerData(data: object, options: { payloadId: string }): Async<TrackerResponse> {
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

    async getFromTracker<T>(
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

type TrackerDataKey = "events" | "enrollments" | "trackedEntities";
