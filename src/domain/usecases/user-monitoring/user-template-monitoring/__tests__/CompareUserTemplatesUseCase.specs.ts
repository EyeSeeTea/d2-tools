import { describe, it, expect, beforeEach } from "vitest";

import { user1, user1Updated, expectedDiff } from "./CompareUserTemplatesUseCase.data";

import { CompareUserTemplatesUseCase } from "../CompareUserTemplatesUseCase";
import { User, UserTemplateDiff } from "domain/entities/user-monitoring/user-template-monitoring/Users";

describe("CompareUserTemplatesUseCase", () => {
    let useCase: CompareUserTemplatesUseCase;

    beforeEach(() => {
        useCase = new CompareUserTemplatesUseCase();
    });

    it("should not fild differences between the same user templates", () => {
        const noChangesDiff: UserTemplateDiff = {
            id: user1.id,
            username: user1.username,
            changedPropsLost: {},
            changedPropsAdded: {},
            membershipChanges: {
                userRoles_Lost: [],
                userRoles_Added: [],
                userGroups_Lost: [],
                userGroups_Added: [],
            },
            newProps: {},
        };

        const diff = useCase.execute(user1, user1);

        expect(diff).toEqual(noChangesDiff);
    });

    it("should compare user templates and return the differences", () => {
        const diff = useCase.execute(user1, user1Updated);
        console.log(JSON.stringify(diff, null, 2));

        expect(diff).toEqual(expectedDiff);
    });
});
