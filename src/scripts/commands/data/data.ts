import _ from "lodash";
import { command, subcommands, option, string } from "cmd-ts";
import { getApiUrlOptions, getD2ApiFromArgs } from "scripts/common";
import { DataValuesD2Repository } from "data/DataValuesD2Repository";
import { EventsD2Repository } from "data/enrollments/EventsD2Repository";
import { OrgUnitD2Repository } from "data/OrgUnitD2Repository";
import { ProgramsD2Repository } from "data/ProgramsD2Repository";
import { TrackedEntityD2Repository } from "data/TrackedEntityD2Repository";
import { GetDataReportUseCase } from "domain/usecases/GetDataReportUseCase";
import { DataReportGenerator } from "./DataReportGenerator";

export function getCommand() {
    const getReportCommand = command({
        name: "generate-report",
        description: "Generate report of data for aggregated and programs",
        args: {
            ...getApiUrlOptions(),
            orgUnitId: option({
                type: string,
                long: "orgunit-id",
                description: "Parent organisation unit ID",
            }),
        },
        handler: async args => {
            const api = getD2ApiFromArgs(args);

            const orgUnitRepository = new OrgUnitD2Repository(api);
            const programRepository = new ProgramsD2Repository(api);
            const dataValueRepository = new DataValuesD2Repository(api);
            const eventRepository = new EventsD2Repository(api);
            const trackedEntitiesRepository = new TrackedEntityD2Repository(api);

            const report = await new GetDataReportUseCase(
                orgUnitRepository,
                programRepository,
                dataValueRepository,
                eventRepository,
                trackedEntitiesRepository
            ).execute({
                parentOrgUnitId: args.orgUnitId,
            });

            await new DataReportGenerator(report, args).execute();
        },
    });

    return subcommands({
        name: "get-report",
        cmds: {
            "get-report": getReportCommand,
        },
    });
}
