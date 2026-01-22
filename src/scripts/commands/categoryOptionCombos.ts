import { subcommands } from "cmd-ts";
import { regenerateCocsCmd } from "./category-option-combos/regenerateCocsCmd";
import { translateCocsCmd } from "./category-option-combos/translateCocsCmd";

export function getCommand() {
    return subcommands({
        name: "categoryOptionCombos",
        cmds: {
            translate: translateCocsCmd,
            regenerate: regenerateCocsCmd,
        },
    });
}
