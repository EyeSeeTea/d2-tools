import { describe, expect, test } from "vitest";
import { buildDataSetScope, isInDataSetScope } from "../DataSetScope";
import { MetadataObject } from "../MetadataObject";

const dataSets = [
    obj("dataSets", "ds1", {
        dataSetElements: [{ dataSet: { id: "ds1" }, dataElement: { id: "de1" } }],
        indicators: [{ id: "ind1" }],
    }),
    obj("dataSets", "ds2", {
        dataSetElements: [{ dataSet: { id: "ds2" }, dataElement: { id: "de2" } }],
        indicators: null,
    }),
];

const dataElements = [
    obj("dataElements", "de1", { optionSet: { id: "os1" } }),
    obj("dataElements", "de2", { optionSet: { id: "os2" } }),
];

const scope = buildDataSetScope(["ds1"], dataSets, dataElements);

describe("buildDataSetScope", () => {
    test("collects the data elements, indicators and option sets of the given data sets", () => {
        expect(scope).toEqual({
            dataSetIds: ["ds1"],
            dataElementIds: ["de1"],
            indicatorIds: ["ind1"],
            optionSetIds: ["os1"],
        });
    });
});

describe("isInDataSetScope", () => {
    test("keeps objects reachable from the scoped data sets, by model", () => {
        expect(isInDataSetScope(obj("dataElements", "de1"), scope)).toBe(true);
        expect(isInDataSetScope(obj("dataElements", "de2"), scope)).toBe(false);
        expect(isInDataSetScope(obj("indicators", "ind1"), scope)).toBe(true);
        expect(isInDataSetScope(obj("indicators", "ind2"), scope)).toBe(false);
        expect(isInDataSetScope(obj("sections", "s1", { dataSet: { id: "ds1" } }), scope)).toBe(true);
        expect(isInDataSetScope(obj("sections", "s2", { dataSet: { id: "ds2" } }), scope)).toBe(false);
        expect(isInDataSetScope(obj("options", "o1", { optionSet: { id: "os1" } }), scope)).toBe(true);
        expect(isInDataSetScope(obj("options", "o2", { optionSet: { id: "os2" } }), scope)).toBe(false);
        expect(isInDataSetScope(obj("dataSets", "ds1"), scope)).toBe(true);
    });

    test("rejects models without a data set relation", () => {
        expect(() => isInDataSetScope(obj("programs", "p1"), scope)).toThrow("programs");
    });
});

function obj(model: string, id: string, fields: object = {}): MetadataObject {
    return { model, id, name: id, code: undefined, ...fields };
}
