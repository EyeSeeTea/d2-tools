import { subcommands } from "cmd-ts";
import { translateCocsCmd } from "./category-option-combos/translateCocsCmd";

export function getCommand() {
    return subcommands({
        name: "categoryOptionCombos",
        cmds: {
            translate: translateCocsCmd,
        },
    });
}
