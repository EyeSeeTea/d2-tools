import _ from "lodash";
import { DataSetsRepository, OUCopyResult } from "domain/repositories/DataSetsRepository";
import { Id, Ref } from "types/d2-api";
import { DataSet } from "domain/entities/DataSet";
import { DataSetMetadata } from "domain/entities/DataSet";

export class CopyDataSetsOUUserCase {
    constructor(private dataSetsRepository: DataSetsRepository) {}

    async execute(options: {
        originDataset: Id;
        destinationDatasets: string[];
        replace: boolean | undefined;
    }): Promise<OUCopyResult> {
        const { originDataset, destinationDatasets, replace = false } = options;

        console.debug(`Replace the destination OU: ${replace}`);

        const datasets = await this.dataSetsRepository.get([originDataset, ...destinationDatasets]);

        const origDataset = datasets[originDataset];
        const destDatasets = destinationDatasets.map(id => datasets[id]);

        if (!origDataset || !destDatasets) throw new Error("Missing DataSets");

        const data: DataSet[] = _(destDatasets)
            .map(destDataSet => {
                if (!destDataSet) throw new Error("Missing DataSets");
                const dataSetsEqual = compare(origDataset, destDataSet, replace);
                let item: DataSet | undefined = undefined;

                if (!dataSetsEqual) {
                    if (replace) {
                        item = { ...destDataSet, organisationUnits: origDataset.organisationUnits };
                    } else {
                        item = mergeDataSetOUs(origDataset, destDataSet);
                    }
                } else {
                    console.debug(`DataSet with ID:${destDataSet.id} already contains all the OUs.`);
                }

                return item;
            })
            .compact()
            .value();

        let result: OUCopyResult;
        if (!_.isEmpty(data)) {
            const metadata: DataSetMetadata = { dataSets: data };
            result = await this.dataSetsRepository.post(metadata);
            if (result === "ERROR") console.debug("Error while posting the dataSets.");
        } else {
            result = "NO_CHANGE";
            console.debug("All destination DataSets already contains the OUs. No changes made.");
        }

        return result;
    }
}

function compare(dataSet1: DataSet, dataSet2: DataSet, replace: boolean): boolean {
    const OUs1ToDiff = getDataSetWithSortedOUs(dataSet1);
    const OUs2ToDiff = getDataSetWithSortedOUs(dataSet2);

    if (replace) {
        return _.isEqual(OUs1ToDiff, OUs2ToDiff);
    } else {
        const filtered = OUs2ToDiff.filter(ou => {
            return ou.id === OUs1ToDiff.find(ou2 => ou2.id === ou.id)?.id;
        });
        return _.isEqual(OUs1ToDiff, filtered);
    }
}

function getDataSetWithSortedOUs(dataSet: DataSet): DataSet["organisationUnits"] {
    return sortById(dataSet.organisationUnits);
}

function mergeDataSetOUs(orgDataset: DataSet, destDataSet: DataSet): DataSet {
    const mergedOUs: DataSet["organisationUnits"] = _.uniq([
        ...orgDataset.organisationUnits,
        ...destDataSet.organisationUnits,
    ]);

    return {
        ...destDataSet,
        organisationUnits: mergedOUs,
    };
}

function sortById<T extends Ref>(xs: T[]): T[] {
    return _.sortBy(xs, x => x.id);
}
