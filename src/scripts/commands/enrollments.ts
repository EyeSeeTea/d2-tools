import _ from "lodash";
import log from "utils/log";
import { command, option, subcommands } from "cmd-ts";
import { getApiUrlOption, getD2Api, IDString, MetadataDate } from "scripts/common";
import { EventsD2Repository } from "data/enrollments/EventsD2Repository";
import { CloseEnrollmentsUseCase } from "domain/usecases/enrollments/CloseEnrollmentsUseCase";
import { EnrollmentsD2Repository } from "data/enrollments/EnrollmentsD2Repository";

export function getCommand() {
    return subcommands({
        name: "enrollments",
        cmds: {
            close: closeEnrollmentsCmd,
        },
    });
}

const closeEnrollmentsCmd = command({
    name: "close",
    description: [
        "Set the status to completed for all enrollments whose events have an event date older than the cut off date.",
        "An orgunit, program and date must be provided.",
        "If there are errors the relevant enrollments will be logged into a close_errors_<timestamp>.json file.",
    ].join("\n"),
    args: {
        url: getApiUrlOption({ long: "url" }),
        orgUnit: option({
            type: IDString,
            long: "org-unit-id",
            description: "Organization Unit of the enrollments.",
        }),
        program: option({
            type: IDString,
            long: "program-id",
            description: "Program of the enrollments.",
        }),
        eventUpdateCutoff: option({
            type: MetadataDate,
            long: "event-date-before",
            description: "YYYY-MM-DD[Thh:mm:ss]",
        }),
    },
    handler: async args => {
        log.debug(JSON.stringify(args, null, 2));
        const api = getD2Api(args.url);
        const eventsRepository = new EventsD2Repository(api);
        const enrollmentsRepository = new EnrollmentsD2Repository(api);

        await new CloseEnrollmentsUseCase(eventsRepository, enrollmentsRepository).execute({
            orgUnitId: args.orgUnit,
            programId: args.program,
            eventUpdateCutoff: args.eventUpdateCutoff,
        });
    },
});
