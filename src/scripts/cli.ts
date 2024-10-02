import path from "path";
import { run, subcommands } from "cmd-ts";

import * as datasets from "./commands/datasets";
import * as programs from "./commands/programs";
import * as orgunits from "./commands/orgunits";
import * as userMonitoring from "./commands/userMonitoring";
import * as translations from "./commands/translations";
import * as dataValues from "./commands/dataValues";
import * as notifications from "./commands/notifications";
import * as events from "./commands/events";
import * as sync from "./commands/sync";
import * as users from "./commands/users";
import * as loadTesting from "./commands/loadTesting";
import * as categoryoptions from "./commands/categoryoptions";
import * as indicators from "./commands/indicators";

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
            sync: sync.getCommand(),
            users: users.getCommand(),
            usermonitoring: userMonitoring.getCommand(),
            loadTesting: loadTesting.getCommand(),
            categoryoptions: categoryoptions.getCommand(),
            indicators: indicators.getCommand(),
        },
    });

    const args = process.argv.slice(2);
    run(cliSubcommands, args);
}
