import _ from "lodash";
import { OptionSet } from "domain/entities/OptionSet";
import {
    OptionValidationResult,
    OptionValidationError,
    validationActions,
} from "domain/entities/OptionValidationResult";
import { OptionSetRepository } from "domain/repositories/OptionSetRepository";
import { Async } from "domain/entities/Async";
import { Option } from "domain/entities/Option";
import { Maybe } from "utils/ts-utils";
import { OptionRepository } from "domain/repositories/OptionRepository";
import { promiseMap } from "data/dhis2-utils";

export class ValidateOptionSetsUseCase {
    constructor(
        private readonly optionSetRepository: OptionSetRepository,
        private readonly optionRepository: OptionRepository
    ) {}

    async execute(options: UseCaseOptions): Async<OptionValidationResult[]> {
        const optionsSets = await this.optionSetRepository.getAll();
        const validationResults = this.buildOptionValidationResults(optionsSets, options);
        await this.saveOptions(options, validationResults);

        return validationResults;
    }

    private async saveOptions(
        options: UseCaseOptions,
        validationResults: OptionValidationResult[]
    ): Async<void> {
        if (!options.update) return;

        const optionsToSave = this.fixAndGetOptions(validationResults);
        await promiseMap(optionsToSave, async option => {
            await this.optionRepository.save(option, { dryRun: !options.update });
        });
    }

    private fixAndGetOptions(validationResults: OptionValidationResult[]): Option[] {
        return validationResults.map(validationResult => {
            return _(validationResult.errors)
                .map(err => validationActions[err.type]?.validation)
                .compact()
                .reduce((option, applyFix) => applyFix(option), validationResult.option);
        });
    }

    private buildOptionValidationResults(
        optionsSets: OptionSet[],
        options: UseCaseOptions
    ): OptionValidationResult[] {
        const duplicateOptions = this.getDuplicateOptions(optionsSets);
        const validationResults = this.buildValidationResults(optionsSets, options);
        return duplicateOptions.concat(validationResults).filter(vr => vr.errors.length > 0);
    }

    private buildValidationResults(
        optionSets: OptionSet[],
        options: UseCaseOptions
    ): OptionValidationResult[] {
        const allOptions = optionSets.flatMap(optionSet =>
            optionSet.options.map((option, optionIndex) => ({ option, optionSet, optionIndex }))
        );

        const propertiesToValidate: PropertyToValidate[] = ["code", "name"];

        return allOptions.flatMap(({ option, optionIndex, optionSet }): OptionValidationResult[] => {
            const allPropertiesValidationResult = propertiesToValidate.flatMap(propertyName => {
                const invalidLengthRules = this.validateLength(
                    option,
                    options.lengthToValidate,
                    propertyName
                );

                const namingConventionRules = this.validateNamingConventions(option, propertyName);
                const includeCommasRules = this.validateCommas(option, propertyName);
                const orderRules =
                    propertyName === "code" ? this.validateOrder(option, optionIndex) : undefined;

                const allOptionsErrors = _([
                    invalidLengthRules,
                    namingConventionRules,
                    includeCommasRules,
                    orderRules,
                ])
                    .compact()
                    .value();

                return { option, optionSet, errors: allOptionsErrors };
            });

            return _(allPropertiesValidationResult)
                .groupBy(x => x.option.id)
                .map((group): OptionValidationResult => {
                    const option = group[0]?.option;
                    const optionSet = group[0]?.optionSet;
                    if (!optionSet) throw new Error("No optionSet found");
                    if (!option) throw new Error("No option found");

                    const errors = group.flatMap(x => x.errors);
                    return {
                        option,
                        optionSet,
                        errors: errors,
                    };
                })
                .value();
        });
    }

    private validateLength(
        option: Option,
        validationLength: number,
        propertyName: PropertyToValidate
    ): Maybe<OptionValidationError> {
        return option[propertyName].length > validationLength
            ? { type: "invalid_length", message: `${propertyName} length is ${option.code.length}` }
            : undefined;
    }

    private validateNamingConventions(
        option: Option,
        propertyName: PropertyToValidate
    ): Maybe<OptionValidationError> {
        const value = option[propertyName];
        const hasSpaces = /\s/.test(value);
        const specialCharacters = value.match(/[^\w\s,]/g) ?? [];

        const spacesRule = hasSpaces ? "spaces" : undefined;
        const specialRule =
            specialCharacters.length > 0 ? `special characters: ${specialCharacters.join(",")}` : undefined;

        const message = _([spacesRule, specialRule]).compact().join(" and ");

        return spacesRule || specialRule
            ? { type: "naming_conventions", message: `${propertyName} contains ${message}` }
            : undefined;
    }

    private validateCommas(option: Option, propertyName: PropertyToValidate): Maybe<OptionValidationError> {
        return option[propertyName].includes(",")
            ? { type: "has_commas", message: `${propertyName} has commas` }
            : undefined;
    }

    private validateOrder(option: Option, expectedSortOrder: number): Maybe<OptionValidationError> {
        const expected = expectedSortOrder + 1;
        return option.sortOrder !== expected
            ? { type: "order", message: `sortOrder is ${option.sortOrder}; expected ${expected}` }
            : undefined;
    }

    private getDuplicateOptions(optionSets: OptionSet[]): OptionValidationResult[] {
        return _(optionSets)
            .flatMap(optionSet => optionSet.options.map(option => ({ option: option, optionSet: optionSet })))
            .groupBy(item => item.option.code)
            .values()
            .filter(group => group.length > 1)
            .map((group): OptionValidationResult => {
                if (!group[0]) throw new Error("No optionSet found");
                const { option, optionSet } = group[0];
                const allSetNames = group.map(item => item.optionSet.name).join(", ");
                return {
                    option: option,
                    optionSet: optionSet,
                    errors: [{ type: "duplicate", message: `Found in optionSets: ${allSetNames}` }],
                };
            })
            .value();
    }
}

type UseCaseOptions = { lengthToValidate: number; update: boolean };
type PropertyToValidate = keyof Pick<Option, "code" | "name">;
