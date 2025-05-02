import { Option } from "./Option";
import { OptionSet } from "./OptionSet";

type RuleType = "duplicate" | "naming_conventions" | "invalid_length" | "misplaced_commas" | "order";

export type OptionValidationResult = {
    option: Option;
    optionSet: Omit<OptionSet, "options">;
    errors: OptionValidationError[];
};

export type OptionValidationError = {
    type: RuleType;
    message: string;
};
