import _ from "lodash";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { ProgramExport } from "domain/entities/ProgramExport";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";
import { D2Api } from "types/d2-api";
import log from "utils/log";

export class ProgramsD2Repository implements ProgramsRepository {
    constructor(private api: D2Api) {}

    async export(options: { ids: Id[] }): Async<ProgramExport> {
        const { api } = this;

        const { programs } = await api.metadata
            .get({
                programs: {
                    fields: { $owner: true },
                    filter: { id: { in: options.ids } },
                },
            })
            .getData();

        const events = await this.getFromTracker("events");
        const enrollments = await this.getFromTracker("enrollments");
        const trackedEntities = await this.getFromTracker("trackedEntities");

        return {
            metadata: { programs },
            data: { events, enrollments, trackedEntities },
        };
    }

    async import(programExport: ProgramExport): Async<void> {
        log.info("Import metadata");
        const _metadataRes = await this.api.metadata.post(programExport.metadata).getData();

        log.info("Import data: enrollments, trackedEntities");
        const data1 = _.pick(programExport.data, ["enrollments", "trackedEntities"]);
        const _data1Res = await this.postTracker(data1);

        for (const events in _.chunk(programExport.data.events, 1000)) {
            log.info("Import data: events");
            const _data2Res = await this.postTracker({ events });
        }
    }

    async postTracker(data: object): Async<TrackerResponse> {
        // TODO: Implement in d2-api -> POST api.tracker.post
        const res = await this.api.post<TrackerResponse>("/tracker", { async: false }, data).getData();

        if (res.status !== "OK") {
            console.error(res.typeReports);
            throw new Error("Error on post");
        } else {
            return res;
        }
    }

    async getFromTracker(path: string): Promise<object[]> {
        const output = [];
        let page = 1;
        let dataRemaining = true;

        while (dataRemaining) {
            // TODO: Implement in d2-api -> GET api.tracker.{events,enrollments,trackedEntities}
            const { instances } = await this.api
                .get<{ instances: object[] }>(`/tracker/${path}`, {
                    page,
                    pageSize: 10e3,
                    ouMode: "ALL",
                    fields: "*",
                })
                .getData();

            output.push(...instances);
            page++;
            if (instances.length === 0) dataRemaining = false;
        }

        return output;
    }
}

type TrackerResponse = { status: string; typeReports: object[] };
