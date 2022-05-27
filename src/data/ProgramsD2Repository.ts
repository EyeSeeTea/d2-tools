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

        return { metadata: { programs }, data: {} };
    }
}
