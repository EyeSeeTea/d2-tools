import _ from "lodash";
import { Id } from "domain/entities/Base";
import { OrgUnit } from "domain/entities/OrgUnit";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import logger from "utils/log";

export type ParentNamePosition = "prefix" | "suffix";

export type RenameOrgUnitsFromHierarchyOptions = {
    rootIds: Id[];
    parentNameAs: ParentNamePosition;
    excludeByName: string[];
    post: boolean;
};

export type RenameSummary = { total: number; renamed: number; skipped: number; excluded: number };

const separator = " - ";
const pageSize = 1000;

export class RenameOrgUnitsFromHierarchyUseCase {
    constructor(private orgUnitRepository: OrgUnitRepository) {}

    async execute(options: RenameOrgUnitsFromHierarchyOptions): Promise<RenameSummary> {
        const { rootIds, parentNameAs, excludeByName, post } = options;
        const excludedNames = new Set(excludeByName);
        logger.info(
            `Rename leaf org units under roots [${rootIds.join(", ")}] with parent name as ${parentNameAs}` +
                (excludedNames.size > 0 ? `, excluding names [${excludeByName.join(", ")}]` : "")
        );

        const summary: RenameSummary = { total: 0, renamed: 0, skipped: 0, excluded: 0 };
        const warnedParentIds = new Set<Id>();
        let page = 1;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { objects: leaves, pager } = await this.orgUnitRepository.getLeavesUnderRoots(rootIds, {
                page,
                pageSize,
            });

            const renames = leaves.map(leaf => this.getRename(leaf, parentNameAs, excludedNames));
            const toRename = renames.filter(rename => !rename.skipped);
            const excluded = renames.filter(rename => rename.excluded);

            this.warnUntrimmedParents(leaves, warnedParentIds);
            this.logRenames(renames);

            summary.total += renames.length;
            summary.renamed += toRename.length;
            summary.excluded += excluded.length;
            summary.skipped += renames.length - toRename.length - excluded.length;

            if (post && !_.isEmpty(toRename)) {
                await this.orgUnitRepository.save(
                    toRename.map(rename => rename.orgUnit.rename(rename.newName))
                );
            }

            if (page >= pager.pageCount) break;
            page += 1;
        }

        logger.info(
            `${summary.total} leaves: ${summary.renamed} ${post ? "renamed" : "to rename"}, ${
                summary.skipped
            } unchanged, ${summary.excluded} excluded`
        );

        return summary;
    }

    private getRename(leaf: OrgUnit, position: ParentNamePosition, excludedNames: Set<string>): Rename {
        const keep = (newName: string) => ({ orgUnit: leaf, oldName: leaf.name, newName, skipped: true });

        const parent = leaf.parent;
        if (!parent) return keep(leaf.name);

        // Skip if the excluded name appears anywhere in the leaf's path (leaf or any ancestor).
        const pathNames = [...leaf.ancestors.map(ancestor => ancestor.name), leaf.name];
        if (pathNames.some(name => excludedNames.has(name))) {
            return { ...keep(leaf.name), excluded: true };
        }

        const parentName = parent.name.trim();
        const base = stripAffix(leaf.name.trim(), parentName, position).trim();
        const newName = position === "suffix" ? base + separator + parentName : parentName + separator + base;

        return { orgUnit: leaf, oldName: leaf.name, newName: newName, skipped: newName === leaf.name };
    }

    /* Names are trimmed when building the new name; warn (once per parent) so the source data can be fixed. */
    private warnUntrimmedParents(leaves: OrgUnit[], warnedParentIds: Set<Id>): void {
        leaves.forEach(leaf => {
            const parent = leaf.parent;
            if (!parent || warnedParentIds.has(parent.id) || parent.name === parent.name.trim()) return;
            warnedParentIds.add(parent.id);
            logger.warn(
                `Parent org unit name has leading/trailing whitespace: "${parent.name}" (${parent.id})`
            );
        });
    }

    private logRenames(renames: Rename[]): void {
        renames.forEach(rename => {
            const from = rename.orgUnit.namePath;
            const to = rename.orgUnit.rename(rename.newName).namePath;
            const suffix = rename.excluded ? " (excluded)" : from === to ? " (unchanged)" : "";
            logger.info(`${from} -> ${to}${suffix}`);
        });
    }
}

type Rename = {
    orgUnit: OrgUnit;
    oldName: string;
    newName: string;
    skipped: boolean;
    excluded?: boolean;
};

/* Recover the base name by removing the existing affix. If the name already carries the current
   parent name as affix, remove exactly that (safe when the parent name itself contains the
   separator). Otherwise fall back to removing one segment, so parent renames propagate. */
function stripAffix(name: string, parentName: string, position: ParentNamePosition): string {
    if (position === "suffix") {
        const affix = separator + parentName;
        return name.endsWith(affix) ? name.slice(0, -affix.length) : stripOneSegment(name, position);
    } else {
        const affix = parentName + separator;
        return name.startsWith(affix) ? name.slice(affix.length) : stripOneSegment(name, position);
    }
}

/* Remove one affix segment: the last segment for suffix, the first for prefix. A name with no
   separator is returned unchanged (no affix yet). */
function stripOneSegment(name: string, position: ParentNamePosition): string {
    if (position === "suffix") {
        const index = name.lastIndexOf(separator);
        return index === -1 ? name : name.slice(0, index);
    } else {
        const index = name.indexOf(separator);
        return index === -1 ? name : name.slice(index + separator.length);
    }
}
