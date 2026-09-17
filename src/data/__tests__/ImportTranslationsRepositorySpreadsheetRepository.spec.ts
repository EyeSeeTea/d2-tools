import fs from "fs";
import os from "os";
import path from "path";
import * as XLSX from "xlsx";
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import log from "utils/log";
import { ImportTranslationsRepositorySpreadsheetRepository } from "../ImportTranslationsRepositorySpreadsheetRepository";
import { FieldTranslation } from "domain/entities/FieldTranslations";
import { Locale } from "domain/entities/Locale";
import { Maybe } from "utils/ts-utils";

const locales: Locale[] = [
    { id: "1", name: "English (United Kingdom)", locale: "en_GB" },
    { id: "2", name: "Spanish (Spain)", locale: "es" },
];

const translatableFields = {
    dataElements: ["name", "shortName", "formName"],
    validationRules: ["leftSideDescription"],
};

const header = ["type", "id", "name: English", "formName: English", "formName: Spanish"];
const row = ["dataElement", "abc", "Malaria cases", "Malaria form", "Formulario malaria"];

describe("ImportTranslationsRepositorySpreadsheetRepository", () => {
    beforeEach(() => {
        vi.spyOn(log, "warn").mockImplementation(() => undefined);
    });

    test("without a default locale, columns only produce translations", async () => {
        const fieldTranslation = await getFirst(undefined);

        expect(fieldTranslation?.fields).toEqual({});
        expect(fieldTranslation?.translations).toEqual([
            { property: "NAME", locale: "en_GB", value: "Malaria cases" },
            { property: "FORM_NAME", locale: "en_GB", value: "Malaria form" },
            { property: "FORM_NAME", locale: "es", value: "Formulario malaria" },
        ]);
    });

    test("default-locale columns update the field and keep the translation", async () => {
        // "en" matches the en_GB locale: only the language part is compared.
        const fieldTranslation = await getFirst("en");

        expect(fieldTranslation?.fields).toEqual({ name: "Malaria cases", formName: "Malaria form" });
        expect(fieldTranslation?.translations).toEqual([
            { property: "NAME", locale: "en_GB", value: "Malaria cases" },
            { property: "FORM_NAME", locale: "en_GB", value: "Malaria form" },
            { property: "FORM_NAME", locale: "es", value: "Formulario malaria" },
        ]);
    });

    test("columns of other locales are not written to the field", async () => {
        const fieldTranslation = await getFirst("es");

        expect(fieldTranslation?.fields).toEqual({ formName: "Formulario malaria" });
    });

    describe("bare field columns (no locale)", () => {
        test("write the field, not a translation", async () => {
            const fieldTranslation = await getFirst(undefined, {
                header: ["Type", "UID", "Name", "name", "shortName", "formName: Spanish"],
                row: ["dataElement", "abc", "Old name", "Malaria cases", "Malaria", "Formulario malaria"],
            });

            expect(fieldTranslation?.identifier).toEqual({
                id: "abc",
                name: "Malaria cases",
                code: undefined,
            });
            expect(fieldTranslation?.fields).toEqual({ name: "Malaria cases", shortName: "Malaria" });
            expect(fieldTranslation?.translations).toEqual([
                { property: "FORM_NAME", locale: "es", value: "Formulario malaria" },
            ]);
        });

        test("name is only a lookup key when the row has no id/code", async () => {
            const fieldTranslation = await getFirst(undefined, {
                header: ["type", "name", "shortName"],
                row: ["dataElement", "Malaria cases", "Malaria"],
            });

            expect(fieldTranslation?.identifier).toEqual({
                id: undefined,
                name: "Malaria cases",
                code: undefined,
            });
            expect(fieldTranslation?.fields).toEqual({ shortName: "Malaria" });
        });

        test("ignore columns that are not a translatable field of the model, with a warning", async () => {
            const fieldTranslation = await getFirst(undefined, {
                header: ["type", "id", "shortName", "Comments"],
                row: ["dataElement", "abc", "Malaria", "Reviewed"],
            });

            expect(fieldTranslation?.fields).toEqual({ shortName: "Malaria" });
            expect(log.warn).toHaveBeenCalledWith(
                expect.stringContaining("not a translatable field of dataElements: Comments")
            );
        });

        test("an explicit default-locale column wins over the bare column", async () => {
            const fieldTranslation = await getFirst("en", {
                header: ["type", "id", "shortName", "shortName: English"],
                row: ["dataElement", "abc", "Malaria", "Malaria (en)"],
            });

            expect(fieldTranslation?.fields).toEqual({ shortName: "Malaria (en)" });
        });
    });

    test("spaced column names are converted to the object field name", async () => {
        const fieldTranslation = await getFirst("en", {
            header: ["type", "id", "Left side description: English"],
            row: ["validationRule", "abc", "Left side"],
        });

        expect(fieldTranslation?.fields).toEqual({ leftSideDescription: "Left side" });
        expect(fieldTranslation?.translations).toEqual([
            { property: "LEFT_SIDE_DESCRIPTION", locale: "en_GB", value: "Left side" },
        ]);
    });
});

const tempDirs: string[] = [];

afterAll(() => {
    tempDirs.forEach(dir => fs.rmSync(dir, { recursive: true, force: true }));
});

async function getFirst(
    defaultLocale: Maybe<string>,
    rows: { header: string[]; row: string[] } = { header, row }
): Promise<Maybe<FieldTranslation>> {
    const inputFile = writeSpreadsheet([rows.header, rows.row]);
    const repository = new ImportTranslationsRepositorySpreadsheetRepository();
    const fieldTranslations = await repository.get({ inputFile, locales, defaultLocale, translatableFields });

    return fieldTranslations[0];
}

function writeSpreadsheet(rows: string[][]): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "d2-tools-translations-"));
    tempDirs.push(dir);

    const inputFile = path.join(dir, "translations.xlsx");
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Sheet1");
    XLSX.writeFile(workbook, inputFile);

    return inputFile;
}
