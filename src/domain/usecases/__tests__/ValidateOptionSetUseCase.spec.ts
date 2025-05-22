import { DEFAULT_VALID_LENGTH } from "domain/entities/Option";
import { OptionSet } from "domain/entities/OptionSet";
import { OptionValidationError } from "domain/entities/OptionValidationResult";
import { OptionRepository } from "domain/repositories/OptionRepository";
import { OptionSetRepository } from "domain/repositories/OptionSetRepository";
import { describe, expect, vi, test } from "vitest";
import { ValidateOptionSetsUseCase } from "../ValidateOptionSetsUseCase";

describe("ValidateOptionSetUseCase", () => {
    test("should detect duplicate options", async () => {
        const { optionSetRepository, data, useCase } = buildRepositoryAndUseCase(
            buildOptionSetWithDuplicatedCodes()
        );

        const result = await useCase.execute({ lengthToValidate: DEFAULT_VALID_LENGTH, update: false });

        const optionSetNames = data.map(os => os.name).join(", ");

        expect(optionSetRepository.getAll).toHaveBeenCalled();
        expect(result.length).toBe(1);

        result.forEach(result => {
            result.errors.forEach(error => {
                const expectedError: OptionValidationError = {
                    message: `Found in optionSets: ${optionSetNames}`,
                    type: "duplicate",
                };
                expect(error).toStrictEqual(expectedError);
            });
        });
    });

    test("should detect invalid length in option codes/name", async () => {
        const { optionSetRepository, useCase } = buildRepositoryAndUseCase([buildOptionSet()]);

        const length = 4;
        const result = await useCase.execute({ lengthToValidate: length, update: false });

        expect(optionSetRepository.getAll).toHaveBeenCalled();
        expect(result.length).toBe(2);
        result.forEach(result => {
            result.errors.forEach(error => {
                expect(error.message).toMatch(/length is/);
                expect(error.type).toBe("invalid_length");
            });
        });
    });

    test("should follow naming conventions in option codes/names", async () => {
        const { optionSetRepository, useCase } = buildRepositoryAndUseCase([
            buildOptionSetInvalidNamingConventions(),
        ]);

        const result = await useCase.execute({ lengthToValidate: DEFAULT_VALID_LENGTH, update: false });

        expect(optionSetRepository.getAll).toHaveBeenCalled();
        expect(result.length).toBe(1);
        result.forEach(result => {
            result.errors.forEach(error => {
                expect(error.type).toBe("naming_conventions");
            });
        });
    });

    test("should validate if codes/names have commas", async () => {
        const { optionSetRepository, useCase } = buildRepositoryAndUseCase([buildOptionSetWithCommas()]);
        const result = await useCase.execute({ lengthToValidate: DEFAULT_VALID_LENGTH, update: false });

        expect(optionSetRepository.getAll).toHaveBeenCalled();
        expect(result.length).toBe(1);
        result.forEach(result => {
            result.errors.forEach(error => {
                expect(error.type).toBe("has_commas");
                expect(error.message).toMatch("has commas");
            });
        });
    });

    test("should validate incorrect sortOrder", async () => {
        const { optionSetRepository, useCase } = buildRepositoryAndUseCase([buildOptionSetUnordered()]);
        const result = await useCase.execute({ lengthToValidate: DEFAULT_VALID_LENGTH, update: false });

        expect(optionSetRepository.getAll).toHaveBeenCalled();
        expect(result.length).toBe(2);
        result.forEach(result => {
            result.errors.forEach(error => {
                const errorExpected: OptionValidationError = {
                    message: `sortOrder is ${result.option.sortOrder}`,
                    type: "order",
                };

                expect(error.message).toMatch(errorExpected.message);
                expect(error.type).toBe(errorExpected.type);
            });
        });
    });

    test("should generate empty result if all options are valid", async () => {
        const { optionSetRepository, useCase } = buildRepositoryAndUseCase(buildValidOptionSets());
        const result = await useCase.execute({ lengthToValidate: DEFAULT_VALID_LENGTH, update: false });

        expect(optionSetRepository.getAll).toHaveBeenCalled();
        expect(result.length).toBe(0);
    });

    test("should update options if code/name is invalid", async () => {
        const { useCase, optionRepository } = buildRepositoryAndUseCase([
            buildOptionSetInvalidNamingConventions(),
            buildOptionSetWithCommas(),
        ]);

        const result = await useCase.execute({ lengthToValidate: DEFAULT_VALID_LENGTH, update: true });

        const saveOptions = { dryRun: false };

        expect(optionRepository.save).toHaveBeenCalledTimes(2);
        expect(optionRepository.save).toHaveBeenNthCalledWith(
            1,
            { ...result[0]?.option, code: "_invalid__code_", name: "name1_" },
            saveOptions
        );
        expect(optionRepository.save).toHaveBeenNthCalledWith(
            2,
            { ...result[1]?.option, code: "invalid_code", name: "name1_value" },
            saveOptions
        );
    });
});

function buildRepositoryAndUseCase(data: OptionSet[]) {
    const optionSetRepository: OptionSetRepository = { getAll: vi.fn().mockResolvedValue(data) };
    const optionRepository: OptionRepository = {
        getById: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockResolvedValue(undefined),
    };
    const useCase = new ValidateOptionSetsUseCase(optionSetRepository, optionRepository);
    return { useCase, optionSetRepository, data, optionRepository };
}

function buildOptionSetWithDuplicatedCodes(): OptionSet[] {
    return [
        buildOptionSet(),
        buildOptionSet({
            id: "optionSet2",
            name: "Option Set 2",
            options: [
                { id: "option3", code: "code1", name: "name3", sortOrder: 1 },
                { id: "option4", code: "code4", name: "name4", sortOrder: 2 },
            ],
        }),
    ];
}

function buildOptionSetInvalidNamingConventions(): OptionSet {
    return buildOptionSet({
        options: [{ id: "option1", code: " invalid[]code ", name: "name1@", sortOrder: 1 }],
    });
}

function buildOptionSetWithCommas(): OptionSet {
    return buildOptionSet({
        options: [{ id: "option1", code: "invalid,code", name: "name1,value", sortOrder: 1 }],
    });
}

function buildOptionSetUnordered(): OptionSet {
    return buildOptionSet({
        options: [
            { id: "option1", code: "code1", name: "name1", sortOrder: 3 },
            { id: "option1", code: "code2", name: "name1", sortOrder: 10 },
        ],
    });
}

function buildValidOptionSets(): OptionSet[] {
    return [
        buildOptionSet(),
        buildOptionSet({
            id: "optionSet2",
            name: "Option Set 2",
            options: [
                { id: "option3", code: "code3", name: "name3", sortOrder: 1 },
                { id: "option4", code: "code4", name: "name4", sortOrder: 2 },
            ],
        }),
    ];
}

function buildOptionSet(data?: Partial<OptionSet>): OptionSet {
    return {
        id: "optionSet1",
        name: "Option Set 1",
        code: undefined,
        options: [
            { id: "option1", code: "code1", name: "name1", sortOrder: 1 },
            { id: "option2", code: "code2", name: "name2", sortOrder: 2 },
        ],
        ...data,
    };
}
