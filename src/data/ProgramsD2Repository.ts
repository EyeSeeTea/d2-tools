import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { ProgramExport } from "domain/entities/ProgramExport";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";
import { D2Api } from "types/d2-api";

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

        const { instances: enrollments } = await api.tracker.enrollments
            .get({ ouMode: "ALL", pageSize: maxPageSize, fields: { $all: true } })
            .getData();

        const { trackedEntityInstances } = await api.trackedEntityInstances
            .getAll({ ouMode: "ALL", totalPages: true, pageSize: maxPageSize })
            .getData();

        const { events } = await api.events
            .getAll({ totalPages: true, pageSize: maxPageSize, fields: { $all: true } })
            .getData();

        return {
            metadata: { programs },
            data: { events, enrollments, trackedEntityInstances },
        };
    }
}

const maxPageSize = 1e6;
