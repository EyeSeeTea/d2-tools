import { describe, it, expect, beforeEach } from "vitest";

import { user1, user1Updated, noChangesDiff, expectedDiff } from "./CompareUserTemplatesUseCase.data";

import { CompareUserTemplates } from "../CompareUserTemplates";

describe("CompareUserTemplatesUseCase", () => {
    let useCase: CompareUserTemplates;

    beforeEach(() => {
        useCase = new CompareUserTemplates();
    });

    it("should not fild differences between the same user templates", () => {
        const diff = useCase.execute(user1, user1);

        expect(diff).toEqual(noChangesDiff);
    });

    it("should compare user templates and return the differences", () => {
        const diff = useCase.execute(user1, user1Updated);

        expect(diff).toEqual(expectedDiff);
    });
});
