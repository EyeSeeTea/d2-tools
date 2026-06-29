import { describe, expect, test } from "vitest";
import { parseModels, parseModelsOption } from "../translations";

describe("parseModels", () => {
    test("parses models with per-model fields", () => {
        expect(parseModels("dataElements[name,formName],indicators[name]")).toEqual([
            { model: "dataElements", fields: ["name", "formName"] },
            { model: "indicators", fields: ["name"] },
        ]);
    });

    test("trims whitespace and keeps models without fields as empty", () => {
        expect(parseModels("dataElements[ name , formName ], indicators")).toEqual([
            { model: "dataElements", fields: ["name", "formName"] },
            { model: "indicators", fields: [] },
        ]);
    });
});

describe("parseModelsOption (compulsory fields)", () => {
    test("returns the selections when every model has fields", () => {
        expect(parseModelsOption("dataElements[name],indicators[name]")).toEqual([
            { model: "dataElements", fields: ["name"] },
            { model: "indicators", fields: ["name"] },
        ]);
    });

    test("throws naming the models missing fields", () => {
        expect(() => parseModelsOption("dataElements[name],indicators")).toThrow(/indicators/);
    });

    test("throws when no models are provided", () => {
        expect(() => parseModelsOption("")).toThrow(/No models/);
    });
});
