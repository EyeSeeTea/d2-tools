import { describe, expect, test } from "vitest";
import { NamedRef } from "domain/entities/Base";
import { OrgUnit } from "domain/entities/OrgUnit";
import { OrgUnitTestRepository } from "data/OrgUnitTestRepository";
import { RenameOrgUnitsFromHierarchyUseCase } from "../RenameOrgUnitsFromHierarchyUseCase";

const parent: NamedRef = { id: "PARENT000aa", name: "Gaza Secondary Healthcare" };

describe("RenameOrgUnitsFromHierarchyUseCase", () => {
    test("adds the parent name as suffix", async () => {
        const { useCase, repository } = setup([leaf("Mental Health")]);

        const summary = await useCase.execute(options({ parentNameAs: "suffix" }));

        expect(summary).toEqual({ total: 1, renamed: 1, skipped: 0, excluded: 0 });
        expect(repository.saved.map(ou => ou.name)).toEqual(["Mental Health - Gaza Secondary Healthcare"]);
    });

    test("adds the parent name as prefix", async () => {
        const { useCase, repository } = setup([leaf("Mental Health")]);

        await useCase.execute(options({ parentNameAs: "prefix" }));

        expect(repository.saved.map(ou => ou.name)).toEqual(["Gaza Secondary Healthcare - Mental Health"]);
    });

    test("does not write anything on a dry run (post=false)", async () => {
        const { useCase, repository } = setup([leaf("Mental Health")]);

        const summary = await useCase.execute(options({ parentNameAs: "suffix", post: false }));

        expect(summary).toEqual({ total: 1, renamed: 1, skipped: 0, excluded: 0 });
        expect(repository.saved).toEqual([]);
    });

    test("is idempotent: a re-run with an unchanged parent skips the leaf", async () => {
        const { useCase, repository } = setup([leaf("Mental Health - Gaza Secondary Healthcare")]);

        const summary = await useCase.execute(options({ parentNameAs: "suffix" }));

        expect(summary).toEqual({ total: 1, renamed: 0, skipped: 1, excluded: 0 });
        expect(repository.saved).toEqual([]);
    });

    test("propagates a parent rename by replacing the existing affix", async () => {
        const renamedParent: NamedRef = { id: parent.id, name: "Gaza Secondary Healthcare Center" };
        const { useCase, repository } = setup([
            leaf("Mental Health - Gaza Secondary Healthcare", renamedParent),
        ]);

        await useCase.execute(options({ parentNameAs: "suffix" }));

        expect(repository.saved.map(ou => ou.name)).toEqual([
            "Mental Health - Gaza Secondary Healthcare Center",
        ]);
    });

    test("known limitation: a base name containing the separator is mis-split on first run", async () => {
        const { useCase, repository } = setup([leaf("Mental Health - Adults")]);

        await useCase.execute(options({ parentNameAs: "suffix" }));

        // "Adults" is dropped because it is treated as the existing affix segment.
        expect(repository.saved.map(ou => ou.name)).toEqual(["Mental Health - Gaza Secondary Healthcare"]);
    });

    test("excludes a leaf when its own name matches exactly", async () => {
        const { useCase, repository } = setup([
            leaf("Mental Health"),
            leaf("Pharmacy", parent, "LEAF0001bbb"),
        ]);

        const summary = await useCase.execute(
            options({ parentNameAs: "suffix", excludeByName: ["Mental Health"] })
        );

        expect(summary).toEqual({ total: 2, renamed: 1, skipped: 0, excluded: 1 });
        expect(repository.saved.map(ou => ou.name)).toEqual(["Pharmacy - Gaza Secondary Healthcare"]);
    });

    test("excludes a leaf when an ancestor name matches exactly", async () => {
        const { useCase, repository } = setup([leaf("Mental Health")]);

        const summary = await useCase.execute(
            options({ parentNameAs: "suffix", excludeByName: [parent.name] })
        );

        expect(summary).toEqual({ total: 1, renamed: 0, skipped: 0, excluded: 1 });
        expect(repository.saved).toEqual([]);
    });

    test("exclusion requires an exact name match (no partial/case match)", async () => {
        const { useCase, repository } = setup([leaf("Mental Health")]);

        await useCase.execute(
            options({ parentNameAs: "suffix", excludeByName: ["mental health", "Mental"] })
        );

        expect(repository.saved.map(ou => ou.name)).toEqual(["Mental Health - Gaza Secondary Healthcare"]);
    });

    test("processes every leaf across multiple pages", async () => {
        const leaves = _range(2500).map(index => leaf(`OU ${index}`, parent, `LEAF${pad(index)}`));
        const { useCase, repository } = setup(leaves);

        const summary = await useCase.execute(options({ parentNameAs: "suffix" }));

        expect(summary.total).toBe(2500);
        expect(summary.renamed).toBe(2500);
        expect(repository.saved).toHaveLength(2500);
    });
});

function options(
    overrides: Partial<Parameters<RenameOrgUnitsFromHierarchyUseCase["execute"]>[0]>
): Parameters<RenameOrgUnitsFromHierarchyUseCase["execute"]>[0] {
    return { rootIds: [parent.id], parentNameAs: "suffix", excludeByName: [], post: true, ...overrides };
}

function setup(orgUnits: OrgUnit[]) {
    const repository = new OrgUnitTestRepository(orgUnits);
    const useCase = new RenameOrgUnitsFromHierarchyUseCase(repository);
    return { repository, useCase };
}

function leaf(name: string, parentRef: NamedRef = parent, id = "LEAF0000aaa"): OrgUnit {
    return OrgUnit.create({
        id: id,
        name: name,
        code: "",
        level: 4,
        ancestors: [{ id: "ROOT0000aaa", name: "Root" }, parentRef],
        children: [],
    });
}

function _range(n: number): number[] {
    return Array.from({ length: n }, (_value, index) => index);
}

function pad(n: number): string {
    return n.toString().padStart(7, "0");
}
