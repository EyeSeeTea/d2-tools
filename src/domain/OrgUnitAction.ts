import { Maybe } from "utils/ts-utils";

export interface OrgUnitAction {
    type: "delete";
    level: Maybe<number>;
    path: Maybe<string>;
}
