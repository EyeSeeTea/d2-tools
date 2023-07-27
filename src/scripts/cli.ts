import path from "path";
import { run, subcommands } from "cmd-ts";

import * as datasets from "./commands/datasets";
import * as programs from "./commands/programs";
import * as orgunits from "./commands/orgunits";
import * as userpermissions from "./commands/userpermissions";
import * as translations from "./commands/translations";
import * as dataValues from "./commands/dataValues";
import * as notifications from "./commands/notifications";
import * as events from "./commands/events";
import * as users from "./commands/users";

export function runCli() {
    const cliSubcommands = subcommands({
        name: path.basename(__filename),
        cmds: {
            datasets: datasets.getCommand(),
            programs: programs.getCommand(),
            orgunits: orgunits.getCommand(),
            translations: translations.getCommand(),
            datavalues: dataValues.getCommand(),
            notifications: notifications.getCommand(),
            events: events.getCommand(),
            users: users.getCommand(),
            userspermissions: userpermissions.getCommand(),
        },
    });

    const args = process.argv.slice(2);
    run(cliSubcommands, args);
}
