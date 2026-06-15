import { describe, expect, test, vi } from "vitest";
import { ExportTranslationsUseCase } from "../ExportTranslationsUseCase";
import { Locale } from "domain/entities/Locale";
import { MetadataObjectWithTranslations } from "domain/entities/MetadataObject";
import { MetadataRepository } from "domain/repositories/MetadataRepository";
import { LocalesRepository } from "domain/repositories/LocalesRepository";
import { ExportTranslationsRepository } from "domain/repositories/ExportTranslationsRepository";
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

        const { sheets } = exportTranslations.save.mock.calls[0][0];
        expect(sheets[0].locales.map((l: Locale) => l.locale)).toEqual(["fr", "es"]);
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
        const { sheets } = exportTranslations.save.mock.calls[0][0];
        expect(sheets[0].model).toBe("dataElements");
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

        const options = exportTranslations.save.mock.calls[0][0];
        expect(options.outputFile).toBe("translations.xlsx");
        expect(options.includeData).toBe(true);
        expect(options.sheets.map((s: { model: string }) => s.model)).toEqual([
            "dataElements",
            "indicators",
        ]);
        expect(options.sheets[0].fields).toEqual(["name", "formName"]);
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
    const exportTranslations = { save: vi.fn().mockResolvedValue(undefined) };

    const useCase = new ExportTranslationsUseCase({
        metadata,
        locales: localesRepo,
        exportTranslations: exportTranslations as unknown as ExportTranslationsRepository,
    });

    return { useCase, metadata, localesRepo, exportTranslations };
}
