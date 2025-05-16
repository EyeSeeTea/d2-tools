import { command, flag, option, optional, subcommands } from "cmd-ts";
import { CategoryOptionCombosD2Repository } from "data/CategoryOptionCombosD2Repository";
import { TranslateCategoryOptionCombosUseCase } from "domain/usecases/TranslateCategoryOptionCombosUseCase";
import { getApiUrlOptions, getD2Api, getD2ApiFromArgs, IdsSeparatedByCommas } from "scripts/common";

export function getCommand() {
    return subcommands({
        name: "categoryOptionCombos",
        cmds: {
            translate: translateCocsCmd,
        },
    });
}

const translateCocsCmd = command({
    name: "translate",
    description: "Translate category option combos name from their category options",
    args: {
        ...getApiUrlOptions(),
        categoryComboIds: option({
            type: optional(IdsSeparatedByCommas),
            long: "category-combo-ids",
            description: "List of category combo ids whose category option combos will be translated",
        }),
        post: flag({
            long: "post",
            description: "Save the newly translated category option combosr",
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const categoryOptionCombosRepository = new CategoryOptionCombosD2Repository(api);

        const useCase = new TranslateCategoryOptionCombosUseCase(categoryOptionCombosRepository);
        const res = await useCase.execute(args);
        console.log(res);
    },
});
