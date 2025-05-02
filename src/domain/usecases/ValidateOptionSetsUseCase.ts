import _ from "lodash";
import { OptionSet } from "domain/entities/OptionSet";
import { OptionValidationResult, OptionValidationError } from "domain/entities/OptionValidationResult";
import { OptionSetRepository } from "domain/repositories/OptionSetRepository";
import { Async } from "domain/entities/Async";
import { Option } from "domain/entities/Option";
import { Maybe } from "utils/ts-utils";

export class ValidateOptionSetsUseCase {
    constructor(private readonly optionSetRepository: OptionSetRepository) {}

    async execute(options: UseCaseOptions): Async<OptionValidationResult[]> {
        const optionsSets = await this.optionSetRepository.getAll();
        return this.buildOptionValidationResults(optionsSets, options);
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

        return allOptions.map(({ option, optionIndex, optionSet }): OptionValidationResult => {
            const invalidLengthRules = this.validateLength(option, options.codeLength);
            const namingConventionRules = this.validateNamingConventions(option);
            const misplacedCommasRules = this.validateMisplacedCommas(option);
            const orderRules = this.validateOrder(option, optionIndex);

            const allOptionsErrors = _([
                invalidLengthRules,
                namingConventionRules,
                misplacedCommasRules,
                orderRules,
            ])
                .compact()
                .value();

            return { option, optionSet, errors: allOptionsErrors };
        });
    }

    private validateLength(option: Option, validationLength: number): Maybe<OptionValidationError> {
        return option.code.length > validationLength
            ? { type: "invalid_length", message: `Code length is ${option.code.length}` }
            : undefined;
    }

    private validateNamingConventions(option: Option): Maybe<OptionValidationError> {
        const hasSpaces = /\s/.test(option.code);
        const specialCharacters = option.code.match(/[^\w\s,]/g) ?? [];

        const spacesRule = hasSpaces ? "spaces" : undefined;
        const specialRule =
            specialCharacters.length > 0 ? `special characters: ${specialCharacters.join(",")}` : undefined;

        const message = _([spacesRule, specialRule]).compact().join(" and ");

        return spacesRule || specialRule
            ? { type: "naming_conventions", message: `Code contains ${message}` }
            : undefined;
    }

    private validateMisplacedCommas(option: Option): Maybe<OptionValidationError> {
        const hasMisplacedCommas = /^,|,,|,$|,/.test(option.code);
        return hasMisplacedCommas
            ? { type: "misplaced_commas", message: "Code has misplaced commas" }
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

type UseCaseOptions = { codeLength: number };
