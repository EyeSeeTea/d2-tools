import _ from "lodash";
import { OptionSet } from "domain/entities/OptionSet";
import { OptionValidationResult, OptionValidationRule } from "domain/entities/OptionValidationResult";
import { OptionSetRepository } from "domain/repositories/OptionSetRepository";
import logger from "utils/log";
import { Async } from "domain/entities/Async";
import { Option } from "domain/entities/Option";

export class ValidateOptionSetsUseCase {
    constructor(private readonly optionSetRepository: OptionSetRepository) {}

    async execute(options: UseCaseOptions): Async<OptionValidationResult[]> {
        logger.info("Loading optionSets...");
        const optionsSets = await this.optionSetRepository.getAll();
        return this.buildOptionValidationResults(optionsSets, options);
    }

    private buildOptionValidationResults(
        optionsSets: OptionSet[],
        options: UseCaseOptions
    ): OptionValidationResult[] {
        const duplicateOptions = this.getDuplicateOptions(optionsSets);
        const validationResults = this.buildValidationResults(optionsSets, options);
        return duplicateOptions.concat(validationResults).filter(vr => vr.rules.length > 0);
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
            return {
                option,
                optionSet,
                rules: [
                    ...invalidLengthRules,
                    ...namingConventionRules,
                    ...misplacedCommasRules,
                    ...orderRules,
                ],
            };
        });
    }

    private validateLength(option: Option, validationLength: number): OptionValidationRule[] {
        return option.code.length > validationLength
            ? [{ type: "invalid_length", message: `Code length is ${option.code.length}` }]
            : [];
    }

    private validateNamingConventions(option: Option): OptionValidationRule[] {
        const hasSpaces = /\s/.test(option.code);
        const hasSpecialCharacters = option.code.match(/[^\w\s]/) ?? [];

        const spacesRule = hasSpaces ? "spaces" : "";
        const specialRule =
            hasSpecialCharacters.length > 0 ? `special characters: ${hasSpecialCharacters.join(",")}` : "";

        const message = [spacesRule, specialRule].filter(Boolean).join(" and ");

        return spacesRule || specialRule
            ? [{ type: "naming_conventions", message: `Code contains ${message}` }]
            : [];
    }

    private validateMisplacedCommas(option: Option): OptionValidationRule[] {
        return option.code.includes(",")
            ? [{ type: "misplaced_commas", message: `Code has misplaced commas` }]
            : [];
    }

    private validateOrder(option: Option, expectedSortOrder: number): OptionValidationRule[] {
        const expected = expectedSortOrder + 1;
        return option.sortOrder !== expected
            ? [{ type: "order", message: `sortOrder is ${option.sortOrder}; expected ${expected}` }]
            : [];
    }

    private getDuplicateOptions(optionSets: OptionSet[]): OptionValidationResult[] {
        return _(optionSets)
            .flatMap(optionSet => optionSet.options.map(option => ({ option: option, optionSet: optionSet })))
            .groupBy(item => item.option.code)
            .pickBy(group => group.length > 1)
            .map((group): OptionValidationResult => {
                if (!group[0]) throw new Error("No optionSet found");
                const { option, optionSet } = group[0];
                const allSetNames = group.map(item => item.optionSet.name).join(", ");
                return {
                    option: option,
                    optionSet: optionSet,
                    rules: [{ type: "duplicate", message: `Found in optionSets: ${allSetNames}` }],
                };
            })
            .value();
    }
}

type UseCaseOptions = { codeLength: number };
