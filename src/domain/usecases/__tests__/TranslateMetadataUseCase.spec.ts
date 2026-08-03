import { beforeEach, describe, expect, test, vi } from "vitest";
import { TranslateMetadataUseCase } from "../TranslateMetadataUseCase";
import { FieldTranslation } from "domain/entities/FieldTranslations";
import { Locale } from "domain/entities/Locale";
import { MetadataObjectWithTranslations } from "domain/entities/MetadataObject";
import { MetadataRepository } from "domain/repositories/MetadataRepository";
import { LocalesRepository } from "domain/repositories/LocalesRepository";
import { SchemasRepository } from "domain/repositories/SchemasRepository";
import { ImportTranslationsRepository } from "domain/repositories/ImportTranslationsRepository";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";
import { DataSet } from "domain/entities/DataSet";
import { Program } from "domain/entities/Program";
import log from "utils/log";
import { Maybe } from "utils/ts-utils";

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

const categoryCombo = { id: "cc", categoryOptionCombos: [] };

/* One data set/program per data element, so a lookup that ignores the references shows up. */
const allDataSets: DataSet[] = [buildDataSet("DS1", "abc", 3), buildDataSet("DS2", "xyz", 1)];
const allPrograms: Program[] = [buildProgram("PR1", "abc", undefined), buildProgram("PR2", "xyz", 5)];

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

        await useCase.execute({
            inputFile: "in.xlsx",
            post: false,
            defaultLocale: "en",
            bumpVersions: false,
        });

        expect(importTranslations.get).toHaveBeenCalledWith(
            expect.objectContaining({ inputFile: "in.xlsx", defaultLocale: "en" })
        );
    });

    test("writes the default-locale fields on the object, on top of the translations", async () => {
        const { useCase, metadata } = buildUseCase();

        await useCase.execute({ inputFile: "in.xlsx", post: true, defaultLocale: "en", bumpVersions: false });

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

        await useCase.execute({
            inputFile: "in.xlsx",
            post: false,
            defaultLocale: "en",
            bumpVersions: false,
        });

        expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("dataElements.fromName"));
    });

    test("warns when the default locale writes a unique field", async () => {
        const { useCase } = buildUseCase({
            fieldTranslations: [
                { ...fieldTranslation, translations: [], fields: { name: "Malaria cases (new)" } },
            ],
        });

        await useCase.execute({
            inputFile: "in.xlsx",
            post: false,
            defaultLocale: "en",
            bumpVersions: false,
        });

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

        await useCase.execute({
            inputFile: "in.xlsx",
            post: false,
            defaultLocale: undefined,
            bumpVersions: false,
        });

        expect(log.warn).not.toHaveBeenCalled();
    });

    describe("--bump-versions", () => {
        test("does not look up data sets/programs when the flag is off", async () => {
            const { useCase, dataSets, programs } = buildUseCase();

            await execute(useCase, { post: true, bumpVersions: false });

            expect(dataSets.getAll).not.toHaveBeenCalled();
            expect(programs.get).not.toHaveBeenCalled();
        });

        test("bumps only the data sets/programs using a changed data element", async () => {
            const { useCase, dataSets, programs } = buildUseCase();

            await execute(useCase, { post: true, bumpVersions: true });

            const [dataSetsPayload] = dataSets.post.mock.calls[0];
            expect(dataSetsPayload.dataSets.map((d: DataSet) => [d.id, d.version])).toEqual([["DS1", 4]]);

            const [programsPosted] = programs.save.mock.calls[0];
            // PR1 has no version yet, so it starts at 1.
            expect(programsPosted.map((p: Program) => [p.id, p.version])).toEqual([["PR1", 1]]);
        });

        test("writes nothing in a dry run", async () => {
            const { useCase, dataSets, programs } = buildUseCase();

            await execute(useCase, { post: false, bumpVersions: true });

            expect(dataSets.post).not.toHaveBeenCalled();
            expect(programs.save).not.toHaveBeenCalled();
        });

        test("makes no request when no object changed", async () => {
            const { useCase, dataSets, programs } = buildUseCase({ fieldTranslations: [] });

            await execute(useCase, { post: true, bumpVersions: true });

            expect(dataSets.getAll).not.toHaveBeenCalled();
            expect(programs.get).not.toHaveBeenCalled();
        });
    });
});

function execute(
    useCase: TranslateMetadataUseCase,
    options: { post: boolean; bumpVersions: boolean }
): Promise<void> {
    return useCase.execute({ inputFile: "in.xlsx", defaultLocale: "en", ...options });
}

function buildDataSet(id: string, dataElementId: string, version: Maybe<number>): DataSet {
    return {
        id: id,
        name: `Data set ${id}`,
        code: id,
        version: version,
        skipOffline: false,
        categoryCombo: categoryCombo,
        dataSetElements: [{ dataElement: { id: dataElementId, name: "Element", code: "DE", categoryCombo } }],
        dataInputPeriods: [],
        organisationUnits: [],
    };
}

function buildProgram(id: string, dataElementId: string, version: Maybe<number>): Program {
    return {
        id: id,
        name: `Program ${id}`,
        programType: "WITH_REGISTRATION",
        version: version,
        programStages: [
            {
                id: `${id}-stage`,
                programStageDataElements: [
                    {
                        dataElement: {
                            id: dataElementId,
                            name: "Element",
                            code: "DE",
                            valueType: "TEXT",
                            optionSet: undefined,
                        },
                        displayInReports: false,
                    },
                ],
            },
        ],
    };
}

function buildUseCase(options: { fieldTranslations?: FieldTranslation[] } = {}) {
    const metadata = {
        getAllWithTranslations: vi.fn().mockResolvedValue([object]),
        getPaginated: vi.fn(),
        save: vi.fn().mockResolvedValue({ payload: {}, stats: {} }),
    };

    const dataSets = {
        getAll: vi.fn().mockResolvedValue(allDataSets),
        post: vi.fn().mockResolvedValue("OK"),
    };

    const programs = {
        get: vi.fn().mockResolvedValue(allPrograms),
        save: vi.fn().mockResolvedValue(undefined),
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
        dataSets: dataSets as unknown as DataSetsRepository,
        programs: programs as unknown as ProgramsRepository,
    });

    return { useCase, metadata, localesRepo, schemas, importTranslations, dataSets, programs };
}
