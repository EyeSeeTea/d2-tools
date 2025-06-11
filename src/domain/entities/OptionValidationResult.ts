import { Maybe } from "utils/ts-utils";
import { Option } from "./Option";
import { OptionSet } from "./OptionSet";

type RuleType = "duplicate" | "naming_conventions" | "invalid_length" | "has_commas" | "order";

export type OptionValidationResult = {
    option: Option;
    optionSet: Omit<OptionSet, "options">;
    errors: OptionValidationError[];
};

export type OptionValidationError = {
    type: RuleType;
    message: string;
};

export type ValidationAction = Record<RuleType, Maybe<{ validation: (option: Option) => Option }>>;

export const validationActions: ValidationAction = {
    naming_conventions: {
        validation: (option: Option) => {
            const newCode = fixNamingConventions(option.code);
            const newName = fixNamingConventions(option.name);
            return { ...option, code: newCode, name: newName };
        },
    },
    has_commas: {
        validation: (option: Option) => {
            const commaRegex = /,/g;
            const newCode = option.code.replace(commaRegex, "_");
            const newName = option.name.replace(commaRegex, "_");
            return { ...option, code: newCode, name: newName };
        },
    },
    // TODO: Waiting for feedback on how to apply changes for these rules
    duplicate: undefined,
    invalid_length: undefined,
    order: undefined,
};

function fixNamingConventions(value: string, valueToReplace = "_"): string {
    const valueWithoutSpaces = value.replaceAll(" ", valueToReplace);
    const nonAlphanumericReplaced = valueWithoutSpaces.replace(/[^\w\s,]/g, valueToReplace);
    return nonAlphanumericReplaced;
}
