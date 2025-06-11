import { subcommands } from "cmd-ts";
import { analyzeOptionsCmd } from "scripts/options/analyze";
import { renameCodeCmd } from "scripts/options/rename";

export function getCommand() {
    return subcommands({
        name: "options",
        cmds: { "rename-code": renameCodeCmd, analyze: analyzeOptionsCmd },
    });
}
