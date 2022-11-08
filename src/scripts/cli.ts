import path from "path";
import { run, subcommands } from "cmd-ts";

import * as datasets from "./commands/datasets";
import * as programs from "./commands/programs";
import * as translations from "./commands/translations";
import * as dataValues from "./commands/dataValues";
import * as indicators from "./commands/indicators";

export function runCli() {
    const cliSubcommands = subcommands({
        name: path.basename(__filename),
        cmds: {
            datasets: datasets.getCommand(),
            programs: programs.getCommand(),
            translations: translations.getCommand(),
            datavalues: dataValues.getCommand(),
            indicators: indicators.getCommand(),
        },
    });

    const args = process.argv.slice(2);
    run(cliSubcommands, args);
}
