import { describe, expect, test, vi } from "vitest";
import { ExportTranslationsUseCase, isChanged } from "../ExportTranslationsUseCase";
import { Locale } from "domain/entities/Locale";
import { MetadataObjectWithTranslations } from "domain/entities/MetadataObject";
import { MetadataRepository } from "domain/repositories/MetadataRepository";
import { LocalesRepository } from "domain/repositories/LocalesRepository";
import {
    ExportTranslationsOptions,
    ExportTranslationsRepository,
} from "domain/repositories/ExportTranslationsRepository";
import { MetadataSourceRepository } from "domain/repositories/MetadataSourceRepository";
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

    test("resolves a short reference by substring and strips the suffix from the column name", async () => {
        const { useCase, exportTranslations } = buildUseCase({
            locales: [
                { id: "1", name: "Southern Sotho (Lesotho)", locale: "st" },
                { id: "2", name: "Thai (Thailand)", locale: "th" },
            ],
        });

        await useCase.execute({
            outputFile: "out.xlsx",
            models: [{ model: "dataElement", fields: ["name"] }],
            locales: ["Sotho", "Thai"],
            includeData: false,
        });

        const { sheets } = exportTranslations.save.mock.calls[0][0];
        expect(sheets[0].locales.map((l: Locale) => l.locale)).toEqual(["st", "th"]);
        expect(sheets[0].locales.map((l: Locale) => l.name)).toEqual(["Southern Sotho", "Thai"]);
    });

    test("throws when a reference is ambiguous (matches more than one locale)", async () => {
        const { useCase } = buildUseCase({
            locales: [
                { id: "1", name: "Norwegian Bokmål (Norway)", locale: "nb" },
                { id: "2", name: "Norwegian Nynorsk (Norway)", locale: "nn" },
            ],
        });

        await expect(
            useCase.execute({
                outputFile: "out.xlsx",
                models: [{ model: "dataElement", fields: ["name"] }],
                locales: ["Norwegian"],
                includeData: false,
            })
        ).rejects.toThrow(/Ambiguous locale "Norwegian"/);
    });

    test("pluralizes the requested model for both the fetch and the sheet", async () => {
        const { useCase, metadata, exportTranslations } = buildUseCase();

        await useCase.execute({
            outputFile: "out.xlsx",
            models: [{ model: "dataElement", fields: ["name"] }],
            locales: ["French"],
            includeData: true,
        });

        expect(metadata.getAllWithTranslations).toHaveBeenCalledWith(["dataElements"], {
            programIds: undefined,
            dataSetIds: undefined,
        });
        const { sheets } = exportTranslations.save.mock.calls[0][0];
        expect(sheets[0].model).toBe("dataElements");
    });

    test("scopes the fetch to the given program when programIds is set", async () => {
        const { useCase, metadata } = buildUseCase();

        await useCase.execute({
            outputFile: "out.xlsx",
            models: [{ model: "dataElement", fields: ["name"] }],
            locales: ["French"],
            includeData: true,
            programIds: ["PROG123"],
        });

        expect(metadata.getAllWithTranslations).toHaveBeenCalledWith(["dataElements"], {
            programIds: ["PROG123"],
            dataSetIds: undefined,
        });
    });

    test("scopes the fetch to the given data set when dataSetIds is set", async () => {
        const { useCase, metadata } = buildUseCase();

        await useCase.execute({
            outputFile: "out.xlsx",
            models: [{ model: "dataElement", fields: ["formName"] }],
            locales: ["French"],
            includeData: true,
            dataSetIds: ["DS123"],
        });

        expect(metadata.getAllWithTranslations).toHaveBeenCalledWith(["dataElements"], {
            programIds: undefined,
            dataSetIds: ["DS123"],
        });
    });

    test("rejects programIds and dataSetIds set at the same time", async () => {
        const { useCase } = buildUseCase();

        await expect(
            useCase.execute({
                outputFile: "out.xlsx",
                models: [{ model: "dataElement", fields: ["name"] }],
                locales: ["French"],
                includeData: true,
                programIds: ["PROG123"],
                dataSetIds: ["DS123"],
            })
        ).rejects.toThrow(/exclusive/);
    });

    test("reads objects from metadataSource when given, passing the scope, not from the instance", async () => {
        const fileObject = buildObject({ id: "file1", name: "From file" });
        const metadataSource = { getAllWithTranslations: vi.fn().mockResolvedValue([fileObject]) };
        const { useCase, metadata, exportTranslations } = buildUseCase({ metadataSource });

        await useCase.execute({
            outputFile: "out.xlsx",
            models: [{ model: "dataElements", fields: ["name"] }],
            locales: ["French"],
            includeData: true,
            dataSetIds: ["ds1"],
        });

        expect(metadataSource.getAllWithTranslations).toHaveBeenCalledWith(["dataElements"], {
            programIds: undefined,
            dataSetIds: ["ds1"],
        });
        expect(metadata.getAllWithTranslations).not.toHaveBeenCalled();
        expect(getExportedObjects(exportTranslations)).toEqual([fileObject]);
    });

    test("excludeNames drops objects whose name matches", async () => {
        const kept = buildObject({ id: "id1", name: "Active" });
        const deprecated = buildObject({ id: "id2", name: "[DEPRECATED] Old" });
        const { useCase, exportTranslations } = buildUseCase({ objects: [kept, deprecated] });

        await useCase.execute({
            outputFile: "out.xlsx",
            models: [{ model: "dataElements", fields: ["name"] }],
            locales: ["French"],
            includeData: true,
            excludeNames: /^\[DEPRECATED\]/,
        });

        expect(getExportedObjects(exportTranslations)).toEqual([kept]);
    });

    test("onlyChanged keeps new and changed objects, comparing against the instance by id", async () => {
        const unchanged = buildObject({ id: "same", formName: "Same label" });
        const renamed = buildObject({ id: "renamed", formName: "New label" });
        const added = buildObject({ id: "added", formName: "Brand new" });
        const metadataSource = {
            getAllWithTranslations: vi.fn().mockResolvedValue([unchanged, renamed, added]),
        };
        const referenceObjects = [
            buildObject({ id: "same", formName: "Same label" }),
            buildObject({ id: "renamed", formName: "Old label" }),
        ];
        const { useCase, metadata, exportTranslations } = buildUseCase({
            metadataSource,
            referenceObjects,
        });

        await useCase.execute({
            outputFile: "out.xlsx",
            models: [{ model: "dataElements", fields: ["formName"] }],
            locales: ["French"],
            includeData: true,
            onlyChanged: true,
        });

        expect(metadata.getByIdsWithTranslations).toHaveBeenCalledWith("dataElements", [
            "same",
            "renamed",
            "added",
        ]);
        expect(getExportedObjects(exportTranslations).map(o => o.id)).toEqual(["renamed", "added"]);
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
        expect(options.sheets.map((s: { model: string }) => s.model)).toEqual(["dataElements", "indicators"]);
        expect(options.sheets[0].fields).toEqual(["name", "formName"]);
    });
});

describe("isChanged", () => {
    const fields = ["formName"];

    test("is true when the object does not exist in the reference", () => {
        expect(isChanged(buildObject({ id: "new" }), undefined, fields, "en")).toBe(true);
    });

    test("is false when the selected fields are equal, ignoring surrounding whitespace", () => {
        const object = buildObject({ id: "id1", formName: "Label " });
        const reference = buildObject({ id: "id1", formName: "Label" });
        expect(isChanged(object, reference, fields, undefined)).toBe(false);
    });

    test("ignores changes in non-selected fields", () => {
        const object = buildObject({ id: "id1", name: "[DEPRECATED] Name", formName: "Label" });
        const reference = buildObject({ id: "id1", name: "Name", formName: "Label" });
        expect(isChanged(object, reference, fields, "en")).toBe(false);
    });

    test("is true when only the default-locale translation of a selected field changed", () => {
        const object = buildObject({
            id: "id1",
            formName: "Label",
            translations: [{ property: "FORM_NAME", locale: "en_GB", value: "Label per person" }],
        });
        const reference = buildObject({
            id: "id1",
            formName: "Label",
            translations: [{ property: "FORM_NAME", locale: "en", value: "Label" }],
        });

        expect(isChanged(object, reference, fields, "en")).toBe(true);
        expect(isChanged(object, reference, fields, undefined)).toBe(false);
    });

    test("ignores translation changes in other locales", () => {
        const object = buildObject({
            id: "id1",
            translations: [{ property: "FORM_NAME", locale: "fr", value: "Nouveau" }],
        });
        const reference = buildObject({
            id: "id1",
            translations: [{ property: "FORM_NAME", locale: "fr", value: "Ancien" }],
        });
        expect(isChanged(object, reference, fields, "en")).toBe(false);
    });
});

function buildUseCase(
    options: {
        locales?: Locale[];
        objects?: MetadataObjectWithTranslations[];
        referenceObjects?: MetadataObjectWithTranslations[];
        metadataSource?: MetadataSourceRepository;
    } = {}
) {
    const objects = options.objects ?? [buildObject({})];

    const metadata = {
        getAllWithTranslations: vi.fn().mockResolvedValue(objects),
        getByIdsWithTranslations: vi.fn().mockResolvedValue(options.referenceObjects ?? []),
        getPaginated: vi.fn(),
        save: vi.fn(),
    } as unknown as MetadataRepository;

    const localesRepo: LocalesRepository = {
        get: vi.fn().mockResolvedValue(options.locales ?? locales),
    };
    const exportTranslations = { save: vi.fn().mockResolvedValue(undefined) };

    const useCase = new ExportTranslationsUseCase({
        metadata,
        metadataSource: options.metadataSource,
        locales: localesRepo,
        exportTranslations: exportTranslations as unknown as ExportTranslationsRepository,
    });

    return { useCase, metadata, localesRepo, exportTranslations };
}

function buildObject(
    attrs: Partial<MetadataObjectWithTranslations> & { formName?: string }
): MetadataObjectWithTranslations {
    return {
        model: "dataElements",
        id: "abc",
        name: "Element",
        code: undefined,
        translations: [],
        ...attrs,
    };
}

function getExportedObjects(exportTranslations: {
    save: ReturnType<typeof vi.fn>;
}): MetadataObjectWithTranslations[] {
    const options = exportTranslations.save.mock.calls[0]?.[0] as ExportTranslationsOptions;
    return options.sheets[0]?.objects ?? [];
}
