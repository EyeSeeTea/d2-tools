import _ from "lodash";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { PostOptions, Ref } from "types/d2-api";
import { DataSet } from "domain/entities/DataSet";
import { OUCopyResult } from "domain/entities/OUCopyResult";

export class CopyDataSetsOUUserCase {
    constructor(
        private dataSetsRepository: DataSetsRepository
    ) { }

    async execute(options: {
        originDataset: string;
        destinationDatasets: string[];
        replace: boolean | undefined;
    }): Promise<OUCopyResult> {
        const { originDataset, destinationDatasets, replace } = options;

        console.debug(`Replace the destination OU: ${replace ? "True" : "False"}`);

        const datasets = await this.dataSetsRepository.get([originDataset, ...destinationDatasets]);

        const origDataset = datasets[originDataset];
        const destDatasets = destinationDatasets.map((id) => datasets[id]);

        if (!origDataset || !destDatasets) throw new Error("Missing DataSets");

        const data: DataSet[] = [];

        destDatasets.forEach((destDataSet) => {
            if (!destDataSet) throw new Error("Missing DataSets");
            const dataSetsEqual = compare(origDataset, destDataSet, replace ?? false);

            if (!dataSetsEqual) {
                if (replace) {
                    data.push({ ...destDataSet, organisationUnits: origDataset.organisationUnits })
                } else {
                    data.push(mergeDataSetOUs(origDataset, destDataSet));
                }
            } else {
                console.debug(`DataSet with ID:${destDataSet.id} already contains all the OUs.`);
            }
        });

        let result: OUCopyResult;
        if (!_.isEmpty(data)) {
            const metadata = { dataSets: [...data] };
            const postOptions: Partial<PostOptions> = { async: false };
            const postResponse = await this.dataSetsRepository.post(metadata, postOptions);
            result = postResponse.status;
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
    let differences;

    if (replace) {
        differences = _.isEqual(OUs1ToDiff, OUs2ToDiff);
    } else {
        const filtered = OUs2ToDiff.filter((ou) => {
            return ou.id === OUs1ToDiff.find(ou2 => ou2.id === ou.id)?.id;
        })
        differences = _.isEqual(OUs1ToDiff, filtered)
    }

    return differences;
}

function getDataSetWithSortedOUs(dataSet: DataSet): DataSet["organisationUnits"] {
    return sortById(dataSet.organisationUnits);
}

function mergeDataSetOUs(orgDataset: DataSet, destDataSet: DataSet): DataSet {
    const mergedOUs: DataSet["organisationUnits"] = _.uniqBy(
        [...orgDataset.organisationUnits, ...destDataSet.organisationUnits],
        "id"
    );

    return {
        ...destDataSet,
        organisationUnits: mergedOUs,
    };
}

function sortById<T extends Ref>(xs: T[]): T[] {
    return _.sortBy(xs, x => x.id);
}
