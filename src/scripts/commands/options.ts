import { subcommands } from "cmd-ts";
import { analyzeCodesCmd } from "scripts/options/analyze";
import { renameCodeCmd } from "scripts/options/rename";

export function getCommand() {
    return subcommands({
        name: "options",
        cmds: { "rename-code": renameCodeCmd, "analyze-codes": analyzeCodesCmd },
    });
}
