import _ from "lodash";
import { command, string, subcommands, option, optional, flag } from "cmd-ts";

import { getApiUrlOption, getD2Api, StringsSeparatedByCommas } from "scripts/common";
import { ProgramEventsD2Repository } from "data/ProgramEventsD2Repository";
import { MoveEventsToOrgUnitUseCase } from "domain/usecases/MoveEventsToOrgUnitUseCase";
import logger from "utils/log";

export function getCommand() {
    return subcommands({
        name: "events",
        cmds: {
            "move-to-org-unit": moveOrgUnitCmd,
        },
    });
}

const moveOrgUnitCmd = command({
    name: "move-to-org-unit",
    description: "Move events to another organisation unit for event programs",
    args: {
        url: getApiUrlOption(),
        programIds: option({
            type: optional(StringsSeparatedByCommas),
            long: "programs-ids",
            description: "List of program (comma-separated)",
        }),
        fromOrgUnitId: option({
            type: string,
            long: "from-orgunit-id",
            description: "Organisation Unit source ID",
        }),
        toOrgUnitId: option({
            type: string,
            long: "to-orgunit-id",
            description: "Organisation Unit destination ID",
        }),
        post: flag({
            long: "post",
            description: "Post trackendEntities/events updated from the program rules execution",
        }),
    },
    handler: async args => {
        const api = getD2Api(args.url);
        const programEventsRepository = new ProgramEventsD2Repository(api);

        await new MoveEventsToOrgUnitUseCase(programEventsRepository).execute(args);
        if (!args.post) logger.info(`Add --post to update events`);
    },
});
