import { describe, it, expect } from "vitest";
import _ from "lodash";

import { CompareUserGroupsUseCase } from "../CompareUserGroupsUseCase";
import { emptyDiff, minimalUserGroup, userGroup1 } from "./CompareUserGroupsUseCase.data";

describe("CompareUserGroupsUseCase", () => {
    it("Should return empty array when comparing the same objects", () => {
        const useCase = new CompareUserGroupsUseCase();

        const minUserGroup2 = _.cloneDeep(minimalUserGroup);

        const result = useCase.execute(minimalUserGroup, minUserGroup2);

        const userGroup2 = _.cloneDeep(userGroup1);

        const result2 = useCase.execute(userGroup1, userGroup2);

        expect(result).toEqual(emptyDiff);
        expect(result2).toEqual(emptyDiff);
    });
});

// TODO: Finish the tests
