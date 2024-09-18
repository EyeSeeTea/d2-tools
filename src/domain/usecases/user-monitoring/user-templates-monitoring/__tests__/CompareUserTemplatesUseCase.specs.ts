import { describe, it, expect, beforeEach } from "vitest";

import { user1, user1Updated, noChangesDiff, expectedDiff } from "./CompareUserTemplatesUseCase.data";

import { CompareUserTemplatesUseCase } from "../CompareUserTemplatesUseCase";

describe("CompareUserTemplatesUseCase", () => {
    let useCase: CompareUserTemplatesUseCase;

    beforeEach(() => {
        useCase = new CompareUserTemplatesUseCase();
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
