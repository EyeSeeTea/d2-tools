import _ from "lodash";
import { command, option, subcommands } from "cmd-ts";
import { getApiUrlOption, getD2Api, IDString, MetadataDate } from "scripts/common";
import { EventsD2Repository } from "data/enrollments/EventsD2Repository";
// import { GetEnrollmentsIDsToCloseUseCase } from "domain/usecases/enrollments/GetEnrollmentsIDsToCloseUseCase";
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
    description:
        "Close enrollments for events that have been updated before a certain date. An orgunit, program and date must be provided.",
    args: {
        url: getApiUrlOption({ long: "url" }),
        orgUnits: option({
            type: IDString,
            long: "org-unit-id",
            description: "Organization Unit(s) of the enrollments, comma-separated",
        }),
        programs: option({
            type: IDString,
            long: "program-id",
            description: "Program(s) of the enrollments, comma-separated",
        }),
        eventUpdateCutoff: option({
            type: MetadataDate,
            long: "event-date-before",
            description: "YYYY-MM-DDThh:mm:ss",
        }),
    },
    handler: async args => {
        console.debug(args);
        const api = getD2Api(args.url);
        const eventsRepository = new EventsD2Repository(api);
        const enrollmentsRepository = new EnrollmentsD2Repository(api);

        await new CloseEnrollmentsUseCase(eventsRepository, enrollmentsRepository).execute({
            orgUnitId: args.orgUnits,
            programId: args.programs,
            eventUpdateCutoff: args.eventUpdateCutoff,
        });
    },
});
