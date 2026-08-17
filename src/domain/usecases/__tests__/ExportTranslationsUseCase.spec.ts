import { describe, expect, Mock, test, vi } from "vitest";
import { ExportTranslationsUseCase } from "../ExportTranslationsUseCase";
import { Locale } from "domain/entities/Locale";
import { MetadataObjectWithTranslations } from "domain/entities/MetadataObject";
import { ModelTranslationsExport } from "domain/entities/ModelTranslationsExport";
import { MetadataRepository } from "domain/repositories/MetadataRepository";
import { LocalesRepository } from "domain/repositories/LocalesRepository";
import {
    ExportTranslationsOptions,
    ExportTranslationsRepository,
} from "domain/repositories/ExportTranslationsRepository";
import log from "utils/log";

const locales: Locale[] = [
    { id: "1", name: "Spanish (Spain)", locale: "es" },
    { id: "2", name: "French", locale: "fr" },
    { id: "3", name: "Arabic", locale: "ar" },
];

describe("ExportTranslationsUseCase", () => {
    test("resolves locales by name (ignoring suffix/case), in the requested order, skipping unknown", async () => {
        const warn = vi.spyOn(log, "warn").mockImplementation(() => undefined);
        const { useCase, exportTranslations } = buildUseCase();

        await useCase.execute({
            outputFile: "out.xlsx",
            models: [{ model: "dataElement", fields: ["name"] }],
            locales: ["French", "spanish", "Klingon"],
            includeData: false,
        });

        const { sheets } = firstSaveOptions(exportTranslations);
        expect(firstSheet(sheets).locales.map(l => l.locale)).toEqual(["fr", "es"]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("Klingon"));
    });

    test("pluralizes the requested model for both the fetch and the sheet", async () => {
        const { useCase, metadata, exportTranslations } = buildUseCase();

        await useCase.execute({
            outputFile: "out.xlsx",
            models: [{ model: "dataElement", fields: ["name"] }],
            locales: ["French"],
            includeData: true,
        });

        expect(metadata.getAllWithTranslations).toHaveBeenCalledWith(["dataElements"]);
        const { sheets } = firstSaveOptions(exportTranslations);
        expect(firstSheet(sheets).model).toBe("dataElements");
    });

    test("builds one sheet per model and passes outputFile/includeData through", async () => {
        const { useCase, exportTranslations } = buildUseCase();

        await useCase.execute({
            outputFile: "translations.xlsx",
            models: [
                { model: "dataElements", fields: ["name", "formName"] },
                { model: "indicators", fields: ["name"] },
            ],
            locales: ["French"],
            includeData: true,
        });

        const options = firstSaveOptions(exportTranslations);
        expect(options.outputFile).toBe("translations.xlsx");
        expect(options.includeData).toBe(true);
        expect(options.sheets.map(s => s.model)).toEqual(["dataElements", "indicators"]);
        expect(firstSheet(options.sheets).fields).toEqual(["name", "formName"]);
    });
});

function buildUseCase() {
    const object: MetadataObjectWithTranslations = {
        model: "dataElements",
        id: "abc",
        name: "Element",
        code: undefined,
        translations: [],
    };

    const metadata = {
        getAllWithTranslations: vi.fn().mockResolvedValue([object]),
        getPaginated: vi.fn(),
        save: vi.fn(),
    } as unknown as MetadataRepository;

    const localesRepo: LocalesRepository = { get: vi.fn().mockResolvedValue(locales) };
    const exportTranslations: MockedExportTranslations = {
        save: vi.fn<(options: ExportTranslationsOptions) => Promise<void>>().mockResolvedValue(),
    };

    const useCase = new ExportTranslationsUseCase({
        metadata,
        locales: localesRepo,
        exportTranslations,
    });

    return { useCase, metadata, localesRepo, exportTranslations };
}

type MockedExportTranslations = ExportTranslationsRepository & {
    save: Mock<(options: ExportTranslationsOptions) => Promise<void>>;
};

function firstSaveOptions(exportTranslations: MockedExportTranslations): ExportTranslationsOptions {
    const [firstCall] = exportTranslations.save.mock.calls;
    if (!firstCall) throw new Error("Expected exportTranslations.save to have been called");
    return firstCall[0];
}

function firstSheet(sheets: ModelTranslationsExport[]): ModelTranslationsExport {
    const [sheet] = sheets;
    if (!sheet) throw new Error("Expected at least one sheet");
    return sheet;
}
