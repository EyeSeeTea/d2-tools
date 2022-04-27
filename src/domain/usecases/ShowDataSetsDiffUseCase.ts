import _ from "lodash";
import { CompareResult } from "domain/entities/CompareResult";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { Id, Ref } from "types/d2-api";
import { diffString } from "json-diff";
import { DataSet } from "domain/entities/DataSet";

const defaultIgnoreProperties: Array<keyof DataSet> = ["id", "name"];

export class ShowDataSetsDiffUseCase {
    constructor(
        private dataSetsRepository1: DataSetsRepository,
        private dataSetsRepository2: DataSetsRepository
    ) {}

    async execute(options: {
        dataSetIdsPairs: Array<[Id, Id]>;
        ignoreProperties: string[] | undefined;
    }): Promise<CompareResult[]> {
        const { dataSetIdsPairs, ignoreProperties } = options;

        if (ignoreProperties) console.debug(`Ignored properties: ${ignoreProperties.join(", ")}`);

        const ids1 = dataSetIdsPairs.map(pair => pair[0]);
        const ids2 = dataSetIdsPairs.map(pair => pair[1]);

        const dataSets1 = await this.dataSetsRepository1.get(ids1);
        const dataSets2 = await this.dataSetsRepository2.get(ids2);

        const results: CompareResult[] = [];

        for (const [id1, id2] of dataSetIdsPairs) {
            const dataSet1 = dataSets1[id1];
            const dataSet2 = dataSets2[id2];
            if (!dataSet1 || !dataSet2) throw new Error("Missing datasets");

            const result = compare(dataSet1, dataSet2, options);
            const idsText = `${id1} - ${id2}:`;

            switch (result.type) {
                case "equal":
                    console.info(`${idsText} equal`);
                    break;
                case "non-equal":
                    console.info(`${idsText} non-equal\n` + result.diff);
                    break;
            }

            results.push(result);
        }

        return results;
    }
}

export interface CompareOptions {
    ignoreProperties?: string[];
}

function compare(dataSet1: DataSet, dataSet2: DataSet, options: CompareOptions): CompareResult {
    const dataSet1ToDiff = getDataSetWithSortedSets(dataSet1, options);
    const dataSet2ToDiff = getDataSetWithSortedSets(dataSet2, options);
    const differences = diffString(dataSet1ToDiff, dataSet2ToDiff);

    return differences ? { type: "non-equal", diff: differences } : { type: "equal" };
}

interface ComparableDataSet extends Omit<DataSet, "name" | "dataSetElements" | "sections"> {
    dataSetElements: Array<Omit<DataSet["dataSetElements"][number], "dataSet">>;
    sections: Array<Omit<DataSet["sections"][number], "sortOrder">>;
}

function getDataSetWithSortedSets(dataSet: DataSet, options: CompareOptions): Partial<ComparableDataSet> {
    const comparableDataSet: ComparableDataSet = {
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

    return _.omit(comparableDataSet, ignoreProperties);
}

type SectionWithoutSortOrder = ComparableDataSet["sections"][number];

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
