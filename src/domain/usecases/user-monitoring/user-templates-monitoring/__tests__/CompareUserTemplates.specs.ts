import { describe, it, expect, beforeEach } from "vitest";

import { user1, user1Updated, noChangesDiff, expectedDiff } from "./CompareUserTemplates.data";

import { CompareUserTemplates } from "../CompareUserTemplates";

describe("CompareUserTemplates", () => {
    let compareUserTemplates: CompareUserTemplates;

    beforeEach(() => {
        compareUserTemplates = new CompareUserTemplates();
    });

    it("should not fild differences between the same user templates", () => {
        const diff = compareUserTemplates.execute(user1, user1);

        expect(diff).toEqual(noChangesDiff);
    });

    it("should compare user templates and return the differences", () => {
        const diff = compareUserTemplates.execute(user1, user1Updated);

        expect(diff).toEqual(expectedDiff);
    });
});
