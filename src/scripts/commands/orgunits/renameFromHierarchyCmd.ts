import { array, command, flag, multioption, option, string } from "cmd-ts";
import { OrgUnitD2Repository } from "data/OrgUnitD2Repository";
import {
    ParentNamePosition,
    RenameOrgUnitsFromHierarchyUseCase,
} from "domain/usecases/RenameOrgUnitsFromHierarchyUseCase";
import { choiceOf, getApiUrlOptions, getD2ApiFromArgs, IdsSeparatedByCommas } from "scripts/common";

/**
 * Rename leaf (last-level) organisation units by affixing their parent's name, so that org units
 * sharing the same name (e.g. several "Mental Health" units) can be told apart in the DHIS2 Android
 * Capture app, which only shows the display name.
 *
 * Given a set of root org unit ids (at any level), it finds their leaf descendants and renames each
 * by combining the leaf name with its immediate parent's name, separated by " - ". The new name is
 * recomputed every run (the existing affix segment is stripped and the current parent re-applied),
 * so re-runs are idempotent and parent renames propagate.
 */
export const renameFromHierarchyCmd = command({
    name: "rename-from-hierarchy",
    description: "Rename leaf org units adding their parent org unit name as prefix/suffix",
    args: {
        ...getApiUrlOptions(),
        rootOrgUnitIds: option({
            type: IdsSeparatedByCommas,
            long: "root-orgunit-ids",
            description: "Root org unit ids (at any level) whose leaf descendants will be renamed",
        }),
        parentNameAs: option({
            type: choiceOf<ParentNamePosition>(["prefix", "suffix"]),
            long: "parent-name-as",
            description: "Where to place the parent name: prefix | suffix",
        }),
        excludeByName: multioption({
            type: array(string),
            long: "exclude-by-name",
            description:
                "Exclude leaves from renaming when this exact name appears anywhere in their path (leaf or any ancestor). Repeatable.",
        }),
        post: flag({
            long: "post",
            description: "Apply the renames (without it, the command only previews the changes)",
        }),
    },
    handler: async args => {
        const api = getD2ApiFromArgs(args);
        const orgUnitRepository = new OrgUnitD2Repository(api);

        const useCase = new RenameOrgUnitsFromHierarchyUseCase(orgUnitRepository);
        const summary = await useCase.execute({
            rootIds: args.rootOrgUnitIds,
            parentNameAs: args.parentNameAs,
            excludeByName: args.excludeByName,
            post: args.post,
        });

        const action = args.post ? "renamed" : "to rename";
        console.info(
            `${summary.total} leaf org units (${summary.renamed} ${action}, ${summary.skipped} unchanged, ${summary.excluded} excluded)`
        );
    },
});
