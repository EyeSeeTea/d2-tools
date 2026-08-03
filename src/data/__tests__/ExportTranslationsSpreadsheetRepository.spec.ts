import fs from "fs";
import os from "os";
import path from "path";
import XLSX from "xlsx-js-style";
import { afterEach, describe, expect, test } from "vitest";
import { ExportTranslationsSpreadsheetRepository } from "../ExportTranslationsSpreadsheetRepository";
import { ModelTranslationsExport } from "domain/entities/ModelTranslationsExport";
import { Locale } from "domain/entities/Locale";
import { MetadataObjectWithTranslations } from "domain/entities/MetadataObject";

const french: Locale = { id: "1", name: "French", locale: "fr" };
const spanish: Locale = { id: "2", name: "Spanish", locale: "es" };

const repository = new ExportTranslationsSpreadsheetRepository();

describe("ExportTranslationsSpreadsheetRepository.buildSheet", () => {
    test("builds the header: Type, UID, then a group per field with locales in order", () => {
        const { header } = repository.buildSheet(buildSheetExport(), true);

        expect(header).toEqual([
            "Type",
            "UID",
            "Name",
            "name",
            "name: French",
            "name: Spanish",
            "formName",
            "formName: French",
            "formName: Spanish",
        ]);
    });

    test("with includeData=false writes no data rows (header-only template)", () => {
        const { rows } = repository.buildSheet(buildSheetExport(), false);
        expect(rows).toEqual([]);
    });

    test("fills source values + translations, singular Type, blanks for missing field/translation", () => {
        const { rows } = repository.buildSheet(buildSheetExport(), true);

        // Type is singular; missing translation (name: Spanish) and missing field value are blank.
        expect(rows[0]).toEqual([
            "dataElement",
            "id1",
            "Hello", // Name (object.name)
            "Hello", // name source value
            "Bonjour", // NAME / fr
            "", // NAME / es (missing)
            "HelloForm", // formName source value
            "", // FORM_NAME / fr (missing)
            "Hola form", // FORM_NAME / es
        ]);

        // Second object has no formName field at all -> base column blank.
        expect(rows[1]).toEqual(["dataElement", "id2", "Second", "Second", "", "", "", "", ""]);
    });
});

describe("ExportTranslationsSpreadsheetRepository.save (file round-trip)", () => {
    const outputFile = path.join(os.tmpdir(), `export-translations-${Date.now()}.xlsx`);

    afterEach(() => {
        if (fs.existsSync(outputFile)) fs.rmSync(outputFile);
    });

    test("writes one sheet per model with a header and autofilter", async () => {
        await repository.save({ outputFile, sheets: [buildSheetExport()], includeData: true });

        const workbook = XLSX.readFile(outputFile);
        expect(workbook.SheetNames).toEqual(["dataElements"]);

        const worksheet = getSheet(workbook, "dataElements");
        const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: "" });
        expect(rows[0]?.[0]).toBe("Type");
        expect(rows).toHaveLength(3); // header + 2 objects
        expect(worksheet["!autofilter"]?.ref).toBe("A1:I3");
    });

    test("with includeData=false the sheet has only the header row", async () => {
        await repository.save({ outputFile, sheets: [buildSheetExport()], includeData: false });

        const workbook = XLSX.readFile(outputFile);
        const worksheet = getSheet(workbook, "dataElements");
        const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: "" });
        expect(rows).toHaveLength(1);
        expect(worksheet["!autofilter"]?.ref).toBe("A1:I1");
    });
});

function getSheet(workbook: XLSX.WorkBook, name: string): XLSX.WorkSheet {
    const worksheet = workbook.Sheets[name];
    if (!worksheet) throw new Error(`Sheet not found: ${name}`);
    return worksheet;
}

function buildObject(data: Partial<MetadataObjectWithTranslations> & { formName?: string }) {
    return {
        model: "dataElements",
        code: undefined,
        translations: [],
        ...data,
    } as MetadataObjectWithTranslations;
}

function buildSheetExport(): ModelTranslationsExport {
    return {
        model: "dataElements",
        fields: ["name", "formName"],
        locales: [french, spanish],
        objects: [
            buildObject({
                id: "id1",
                name: "Hello",
                formName: "HelloForm",
                translations: [
                    { property: "NAME", locale: "fr", value: "Bonjour" },
                    { property: "FORM_NAME", locale: "es", value: "Hola form" },
                ],
            }),
            buildObject({ id: "id2", name: "Second" }),
        ],
    };
}
