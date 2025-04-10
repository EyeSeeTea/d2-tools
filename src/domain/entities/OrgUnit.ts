import { NamedRef } from "./Base";
import { DataSet } from "./DataSet";
import { BooleanTree, RecursivePartial } from "../../utils/ts-utils";

export type OrgUnit = (NamedRef & { code: string }) | (NamedRef & { code: string; dataSets: DataSet });

export type OrgUnitFields = RecursivePartial<BooleanTree<OrgUnit>>;
