import _ from "lodash";
import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { ProgramExport } from "domain/entities/ProgramExport";
import { ProgramsRepository, RunRulesOptions } from "domain/repositories/ProgramsRepository";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import { promiseMap, runMetadata } from "./dhis2-utils";
import { D2ProgramRules } from "./d2-program-rules/D2ProgramRules";

type MetadataRes = { date: string } & { [k: string]: Array<{ id: string }> };

export class ProgramsD2Repository implements ProgramsRepository {
    constructor(private api: D2Api) {}

    async export(options: { ids: Id[] }): Async<ProgramExport> {
        const programIds = options.ids;
        const metadata = await this.getMetadata(programIds);
        const events = await this.getFromTracker("events", programIds);
        const enrollments = await this.getFromTracker("enrollments", programIds);
        const trackedEntities = await this.getFromTracker("trackedEntities", programIds);

        return {
            metadata,
            data: { events, enrollments, trackedEntities },
        };
    }

    private async getMetadata(programIds: string[]) {
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
        log.info(`Import metadata: ${metadataRes.status}`);

        log.info("Import data: enrollments, trackedEntities");
        const data1 = _.pick(programExport.data, ["enrollments", "trackedEntities"]);
        await this.postTracker(data1);

        for (const events of _.chunk(programExport.data.events, 1000)) {
            log.info("Import data: events");
            await this.postTracker({ events });
        }
    }

    async runRules(options: RunRulesOptions): Async<void> {
        const d2ProgramRules = new D2ProgramRules(this.api);
        return d2ProgramRules.run(options);
    }

    /* Private */

    private async postTracker(data: object): Async<TrackerResponse> {
        // TODO: Implement in d2-api -> POST api.tracker.post
        const res = await this.api.post<TrackerResponse>("/tracker", { async: false }, data).getData();
        log.debug(res.status);

        if (res.status !== "OK") {
            console.error(JSON.stringify(res.typeReports, null, 4));
            return res;
        } else {
            return res;
        }
    }

    private async getFromTracker(apiPath: string, programIds: string[]): Promise<object[]> {
        const output = [];

        for (const programId of programIds) {
            let page = 1;
            let dataRemaining = true;

            while (dataRemaining) {
                // TODO: Implement in d2-api -> GET api.tracker.{events,enrollments,trackedEntities}
                const { instances } = await this.api
                    .get<{ instances: object[] }>(`/tracker/${apiPath}`, {
                        page,
                        pageSize: 10e3,
                        ouMode: "ALL",
                        fields: "*",
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

        return output;
    }
}

type TrackerResponse = { status: string; typeReports: object[] };
