import { vi, expect, it } from "vitest";

import { programCollection } from "../programCollection";

vi.mock("d2-utilizr/src/isFunction", () => ({ default: () => null }));
vi.mock("d2-utilizr/src/isDefined", () => ({ default: () => null }));

it("programCollection", () => {
    expect(programCollection).toBeDefined();
    expect(programCollection).toBeInstanceOf(Map);
});
