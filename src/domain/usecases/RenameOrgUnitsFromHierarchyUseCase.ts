import _ from "lodash";
import { Id } from "domain/entities/Base";
import { OrgUnit } from "domain/entities/OrgUnit";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import logger from "utils/log";

export type ParentNamePosition = "prefix" | "suffix";

export type RenameOrgUnitsFromHierarchyOptions = {
    rootIds: Id[];
    parentNameAs: ParentNamePosition;
    post: boolean;
};

export type RenameSummary = { total: number; renamed: number; skipped: number };

const separator = " - ";
const pageSize = 1000;

export class RenameOrgUnitsFromHierarchyUseCase {
    constructor(private orgUnitRepository: OrgUnitRepository) {}

    async execute(options: RenameOrgUnitsFromHierarchyOptions): Promise<RenameSummary> {
        const { rootIds, parentNameAs, post } = options;
        logger.info(
            `Rename leaf org units under roots [${rootIds.join(", ")}] with parent name as ${parentNameAs}`
        );

        const summary: RenameSummary = { total: 0, renamed: 0, skipped: 0 };
        let page = 1;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { objects: leaves, pager } = await this.orgUnitRepository.getLeavesUnderRoots(rootIds, {
                page,
                pageSize,
            });

            const renames = leaves.map(leaf => this.getRename(leaf, parentNameAs));
            const toRename = renames.filter(rename => !rename.skipped);

            this.logRenames(toRename);

            summary.total += renames.length;
            summary.renamed += toRename.length;
            summary.skipped += renames.length - toRename.length;

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
            } unchanged`
        );

        return summary;
    }

    private getRename(leaf: OrgUnit, position: ParentNamePosition): Rename {
        const parent = leaf.parent;
        if (!parent) return { orgUnit: leaf, oldName: leaf.name, newName: leaf.name, skipped: true };

        const base = stripOneSegment(leaf.name, position);
        const newName =
            position === "suffix" ? base + separator + parent.name : parent.name + separator + base;

        return { orgUnit: leaf, oldName: leaf.name, newName: newName, skipped: newName === leaf.name };
    }

    private logRenames(renames: Rename[]): void {
        renames.forEach(rename => {
            const from = rename.orgUnit.namePath;
            const to = rename.orgUnit.rename(rename.newName).namePath;
            logger.info(`${from} -> ${to}`);
        });
    }
}

type Rename = { orgUnit: OrgUnit; oldName: string; newName: string; skipped: boolean };

/* Recover the base name by removing one affix segment: the last segment for suffix, the first for
   prefix. A name with no separator is returned unchanged (no affix yet). */
function stripOneSegment(name: string, position: ParentNamePosition): string {
    if (position === "suffix") {
        const index = name.lastIndexOf(separator);
        return index === -1 ? name : name.slice(0, index);
    } else {
        const index = name.indexOf(separator);
        return index === -1 ? name : name.slice(index + separator.length);
    }
}
