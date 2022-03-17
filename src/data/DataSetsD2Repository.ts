import _ from "lodash";
import { diffString } from "json-diff";

import { CompareResult } from "domain/entities/CompareResult";
import { CompareOptions, DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { D2Api, D2DataSetSchema, Id, Ref, SelectedPick } from "types/d2-api";
import { dataSetSchema } from "./DataSetSchema";

const fields = { ...dataSetSchema, id: true as const };

type DataSetBase = SelectedPick<D2DataSetSchema, typeof fields>;

// Make dataSet.dataSetElements[].categoryCombo optional, as this field may not be
// present when using the default disaggregation (d2-api wrongly assumes it is).
interface DataSet extends Omit<DataSetBase, "dataSetElements"> {
    dataSetElements: Array<{ dataElement: Ref; categoryCombo?: Ref; dataSet: Ref }>;
}

type SectionWithoutSortOrder = Omit<DataSet["sections"][number], "sortOrder">;

const defaultIgnoreProperties: Array<keyof DataSet> = ["id"];

export class DataSetsD2Repository implements DataSetsRepository {
    constructor(private api: D2Api) {}

    getSchema(): object {
        return dataSetSchema;
    }

    async compare(id1: Id, id2: Id, options: CompareOptions): Promise<CompareResult> {
        const metadata$ = this.api.metadata.get({
            dataSets: {
                fields,
                filter: { id: { in: [id1, id2] } },
            },
        });
        const { dataSets } = await metadata$.getData();
        const [dataSet1, dataSet2] = _(dataSets)
            .keyBy(ds => ds.id)
            .at([id1, id2])
            .value();
        if (!dataSet1 || !dataSet2) throw new Error("Data set(s) not found");

        const dataSet1ToDiff = getDataSetWithSortedSets(dataSet1, options);
        const dataSet2ToDiff = getDataSetWithSortedSets(dataSet2, options);
        const differences = diffString(dataSet1ToDiff, dataSet2ToDiff);

        return differences ? { type: "non-equal", diff: differences } : { type: "equal" };
    }
}

function getDataSetWithSortedSets(dataSet: DataSet, options: CompareOptions): RecursivePartial<DataSet> {
    const dataSet2: RecursivePartial<DataSet> = {
        ...dataSet,
        dataSetElements: _(dataSet.dataSetElements)
            .sortBy(dse => [dse.dataSet.id, dse.dataElement.id, dse.categoryCombo?.id].join("-"))
            .map(dse => _.omit(dse, ["dataSet"]))
            .value(),
        organisationUnits: sortById(dataSet.organisationUnits),
        attributeValues: _.sortBy(dataSet.attributeValues, attributeValue => attributeValue.attribute.id),
        dataInputPeriods: _.sortBy(dataSet.dataInputPeriods, dip => dip.period.id),
        userAccesses: sortById(dataSet.userAccesses),
        userGroupAccesses: sortById(dataSet.userGroupAccesses),
        indicators: sortById(dataSet.indicators),
        sections: getSections(dataSet),
    };

    const ignoreProperties = (defaultIgnoreProperties as string[]).concat(options.ignoreProperties || []);
    return _.omit(dataSet2, ignoreProperties);
}

function getSections(dataSet: DataSet): SectionWithoutSortOrder[] {
    return _(dataSet.sections)
        .sortBy(section => section.sortOrder)
        .map(section => _.omit(section, ["sortOrder"]))
        .map(
            (section): SectionWithoutSortOrder => ({
                ...section,
                greyedFields: _.sortBy(section.greyedFields, greyedField =>
                    [greyedField.dataElement.id, greyedField.categoryOptionCombo.id].join("-")
                ),
            })
        )
        .value();
}

function sortById<T extends Ref>(xs: T[]): T[] {
    return _.sortBy(xs, x => x.id);
}

type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[]
        ? RecursivePartial<U>[]
        : T[P] extends object
        ? RecursivePartial<T[P]>
        : T[P];
};
