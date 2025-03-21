import _ from "lodash";
import { command, string, option, subcommands, flag } from "cmd-ts";
import { getApiUrlOptions, getD2ApiFromArgs } from "scripts/common";
import { OptionD2Repository } from "data/OptionD2Repository";
import { RenameOptionCodeUseCase } from "domain/usecases/RenameOptionCodeUseCase";

const renameCodeCmd = command({
    name: "rename",
    description: "Rename option code (metadata and associated data values)",
    args: {
        ...getApiUrlOptions(),
        optionId: option({ type: string, long: "id" }),
        toCode: option({ type: string, long: "to-code" }),
        post: flag({ long: "post", description: "Persist changes", defaultValue: () => false }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const optionRepository = new OptionD2Repository(api);
        await new RenameOptionCodeUseCase(optionRepository).execute(args);
    },
});

export function getCommand() {
    return subcommands({ name: "options", cmds: { "rename-code": renameCodeCmd } });
}
