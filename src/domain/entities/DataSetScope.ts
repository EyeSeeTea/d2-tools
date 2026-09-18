import _ from "lodash";
import { Id } from "./Base";
import { MetadataObject } from "./MetadataObject";

/* The objects reachable from a set of data sets: the ones a data-entry form (and its users)
   actually see. Used to restrict exports to the data sets that need translation. */
export interface DataSetScope {
    dataSetIds: Id[];
    dataElementIds: Id[];
    indicatorIds: Id[];
    optionSetIds: Id[];
}

export const dataSetScopeModels = ["dataSets", "dataElements", "indicators", "sections", "options"];

export function buildDataSetScope(
    dataSetIds: Id[],
    dataSets: MetadataObject[],
    dataElements: MetadataObject[]
): DataSetScope {
    const scopedDataSets = dataSets.filter(dataSet => dataSetIds.includes(dataSet.id));

    const dataElementIds = _(scopedDataSets)
        .flatMap(dataSet => getRefs(dataSet, "dataSetElements").map(dse => getRef(dse, "dataElement")))
        .compact()
        .uniq()
        .value();

    const indicatorIds = _(scopedDataSets)
        .flatMap(dataSet => getRefs(dataSet, "indicators").map(ref => ref.id))
        .compact()
        .uniq()
        .value();

    const optionSetIds = _(dataElements)
        .filter(dataElement => dataElementIds.includes(dataElement.id))
        .map(dataElement => getRef(dataElement, "optionSet"))
        .compact()
        .uniq()
        .value();

    return { dataSetIds, dataElementIds, indicatorIds, optionSetIds };
}

export function isInDataSetScope(object: MetadataObject, scope: DataSetScope): boolean {
    switch (object.model) {
        case "dataSets":
            return scope.dataSetIds.includes(object.id);
        case "dataElements":
            return scope.dataElementIds.includes(object.id);
        case "indicators":
            return scope.indicatorIds.includes(object.id);
        case "sections":
            return _.some(scope.dataSetIds, id => id === getRef(object, "dataSet"));
        case "options":
            return _.some(scope.optionSetIds, id => id === getRef(object, "optionSet"));
        default:
            throw new Error(`Model not supported by the data sets scope: ${object.model}`);
    }
}

/* Objects carry their owner fields at runtime (see MetadataObject); read references from them. */
function getRef(object: object, field: string): Id | undefined {
    const value = (object as Record<string, unknown>)[field];
    return _.isPlainObject(value) ? (value as { id?: Id }).id : undefined;
}

function getRefs(object: object, field: string): Array<{ id?: Id }> {
    const value = (object as Record<string, unknown>)[field];
    return _.isArray(value) ? (value as Array<{ id?: Id }>) : [];
}
