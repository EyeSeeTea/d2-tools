import { beforeEach, describe, expect, test, vi } from "vitest";
import { TranslateMetadataUseCase } from "../TranslateMetadataUseCase";
import { FieldTranslation } from "domain/entities/FieldTranslations";
import { Locale } from "domain/entities/Locale";
import { MetadataObjectWithTranslations } from "domain/entities/MetadataObject";
import { MetadataRepository } from "domain/repositories/MetadataRepository";
import { LocalesRepository } from "domain/repositories/LocalesRepository";
import { SchemasRepository } from "domain/repositories/SchemasRepository";
import { ImportTranslationsRepository } from "domain/repositories/ImportTranslationsRepository";
import log from "utils/log";

const locales: Locale[] = [
    { id: "1", name: "English (United Kingdom)", locale: "en_GB" },
    { id: "2", name: "Spanish (Spain)", locale: "es" },
];

const object: MetadataObjectWithTranslations = {
    model: "dataElements",
    id: "abc",
    name: "Malaria cases",
    code: "MAL",
    translations: [{ property: "FORM_NAME", locale: "es", value: "Formulario antiguo" }],
};

const fieldTranslation: FieldTranslation = {
    model: "dataElements",
    identifier: { id: "abc" },
    translations: [
        { property: "FORM_NAME", locale: "en_GB", value: "Malaria form" },
        { property: "FORM_NAME", locale: "es", value: "Formulario malaria" },
    ],
    fields: { formName: "Malaria form" },
};

describe("TranslateMetadataUseCase", () => {
    beforeEach(() => {
        vi.spyOn(log, "warn").mockImplementation(() => undefined);
    });

    test("passes the default locale to the spreadsheet reader", async () => {
        const { useCase, importTranslations } = buildUseCase();

        await useCase.execute({ inputFile: "in.xlsx", post: false, defaultLocale: "en" });

        expect(importTranslations.get).toHaveBeenCalledWith(
            expect.objectContaining({ inputFile: "in.xlsx", defaultLocale: "en" })
        );
    });

    test("writes the default-locale fields on the object, on top of the translations", async () => {
        const { useCase, metadata } = buildUseCase();

        await useCase.execute({ inputFile: "in.xlsx", post: true, defaultLocale: "en" });

        const [objects] = metadata.save.mock.calls[0];
        expect(objects).toEqual([
            {
                ...object,
                formName: "Malaria form",
                translations: [
                    { property: "FORM_NAME", locale: "es", value: "Formulario malaria" },
                    { property: "FORM_NAME", locale: "en_GB", value: "Malaria form" },
                ],
            },
        ]);
    });

    test("warns about fields the instance does not consider translatable", async () => {
        const { useCase } = buildUseCase({
            fieldTranslations: [
                { ...fieldTranslation, translations: [], fields: { fromName: "Typo'd column" } },
            ],
        });

        await useCase.execute({ inputFile: "in.xlsx", post: false, defaultLocale: "en" });

        expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("dataElements.fromName"));
    });

    test("warns when the default locale writes a unique field", async () => {
        const { useCase } = buildUseCase({
            fieldTranslations: [
                { ...fieldTranslation, translations: [], fields: { name: "Malaria cases (new)" } },
            ],
        });

        await useCase.execute({ inputFile: "in.xlsx", post: false, defaultLocale: "en" });

        expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("unique field dataElements.name"));
    });

    test("does not warn about unique fields when they are only translated", async () => {
        const { useCase } = buildUseCase({
            fieldTranslations: [
                {
                    ...fieldTranslation,
                    translations: [{ property: "NAME", locale: "es", value: "Casos de malaria" }],
                    fields: {},
                },
            ],
        });

        await useCase.execute({ inputFile: "in.xlsx", post: false, defaultLocale: undefined });

        expect(log.warn).not.toHaveBeenCalled();
    });
});

function buildUseCase(options: { fieldTranslations?: FieldTranslation[] } = {}) {
    const metadata = {
        getAllWithTranslations: vi.fn().mockResolvedValue([object]),
        getPaginated: vi.fn(),
        save: vi.fn().mockResolvedValue({ payload: {}, stats: {} }),
    };

    const localesRepo: LocalesRepository = { get: vi.fn().mockResolvedValue(locales) };

    const schemas: SchemasRepository = {
        getTranslatableFields: vi.fn().mockResolvedValue({
            dataElements: ["name", "shortName", "formName", "description"],
        }),
    };

    const importTranslations = {
        get: vi.fn().mockResolvedValue(options.fieldTranslations ?? [fieldTranslation]),
    };

    const useCase = new TranslateMetadataUseCase({
        metadata: metadata as unknown as MetadataRepository,
        locales: localesRepo,
        schemas: schemas,
        importTranslations: importTranslations as unknown as ImportTranslationsRepository,
    });

    return { useCase, metadata, localesRepo, schemas, importTranslations };
}
