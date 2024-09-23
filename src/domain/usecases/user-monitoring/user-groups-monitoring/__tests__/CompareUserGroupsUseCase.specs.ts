import { describe, it, expect } from "vitest";
import _ from "lodash";

import { CompareUserGroups } from "../CompareUserGroups";
import {
    emptyDiff,
    userGroup1Diff,
    minimalUserGroup,
    userGroup1,
    userGroup1Updated,
} from "./CompareUserGroupsUseCase.data";

describe("CompareUserGroupsUseCase", () => {
    it("Should return empty array when comparing the same objects", () => {
        const useCase = new CompareUserGroups();

        const minUserGroup2 = _.cloneDeep(minimalUserGroup);

        const result = useCase.execute(minimalUserGroup, minUserGroup2);

        const userGroup2 = _.cloneDeep(userGroup1);

        const result2 = useCase.execute(userGroup1, userGroup2);

        expect(result).toEqual(emptyDiff);
        expect(result2).toEqual(emptyDiff);
    });

    it("Should return the differences between two user groups", () => {
        const useCase = new CompareUserGroups();

        const result = useCase.execute(userGroup1, userGroup1Updated);

        expect(result).toEqual(userGroup1Diff);
    });
});
