import { Maybe } from "utils/ts-utils";
import { Id } from "./Base";
import { Option } from "./Option";

export type OptionSet = {
    id: Id;
    name: string;
    code: Maybe<string>;
    options: Option[];
};
