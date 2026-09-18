import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { MetadataJsonFileRepository } from "../MetadataJsonFileRepository";

const file = path.join(os.tmpdir(), `metadata-${Date.now()}.json`);

const metadata = {
    system: { id: "abc", date: "2026-09-18" },
    dataSets: [
        {
            id: "ds1",
            name: "Data set 1",
            dataSetElements: [{ dataSet: { id: "ds1" }, dataElement: { id: "de1" } }],
        },
    ],
    dataElements: [
        { id: "de1", name: "DE 1", formName: "Form 1", translations: [] },
        { id: "de2", name: "DE 2", code: "DE2" },
    ],
    indicators: [
        {
            id: "ind1",
            name: "Indicator 1",
            translations: [{ property: "NAME", locale: "fr", value: "Indicateur 1" }],
        },
    ],
};

describe("MetadataJsonFileRepository", () => {
    beforeAll(() => fs.writeFileSync(file, JSON.stringify(metadata)));
    afterAll(() => fs.rmSync(file));

    test("returns the objects of the requested models (pluralized), with model and translations", async () => {
        const repository = new MetadataJsonFileRepository(file);

        const objects = await repository.getAllWithTranslations(["indicator", "dataElements"]);

        expect(objects.map(o => [o.model, o.id])).toEqual([
            ["indicators", "ind1"],
            ["dataElements", "de1"],
            ["dataElements", "de2"],
        ]);
        expect(objects[0]?.translations).toEqual([{ property: "NAME", locale: "fr", value: "Indicateur 1" }]);
        expect(objects[2]).toMatchObject({ code: "DE2", translations: [] });
        // Owner fields are kept, so they can be exported as source values.
        expect(objects[1]).toMatchObject({ formName: "Form 1" });
    });

    test("with dataSetId returns only the objects belonging to that data set", async () => {
        const repository = new MetadataJsonFileRepository(file);

        const objects = await repository.getAllWithTranslations(["dataElements"], { dataSetId: "ds1" });
        expect(objects.map(o => o.id)).toEqual(["de1"]);

        await expect(
            repository.getAllWithTranslations(["dataElements"], { dataSetId: "missing" })
        ).rejects.toThrow("Data set not found");
    });

    test("with programId fails: a file has no dependency export", async () => {
        const repository = new MetadataJsonFileRepository(file);
        await expect(
            repository.getAllWithTranslations(["dataElements"], { programId: "p1" })
        ).rejects.toThrow("programId");
    });

    test("returns no objects for models absent from the file", async () => {
        const repository = new MetadataJsonFileRepository(file);
        expect(await repository.getAllWithTranslations(["options"])).toEqual([]);
    });
});
