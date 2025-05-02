import { Option } from "./Option";
import { OptionSet } from "./OptionSet";

type RuleType = "duplicate" | "naming_conventions" | "invalid_length" | "misplaced_commas" | "order";

export type OptionValidationResult = {
    option: Option;
    optionSet: Omit<OptionSet, "options">;
    rules: OptionValidationRule[];
};

export type OptionValidationRule = {
    type: RuleType;
    message: string;
};
