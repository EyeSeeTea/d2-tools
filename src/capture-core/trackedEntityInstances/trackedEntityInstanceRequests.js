//

import { getApi } from "../d2/d2Instance";
import { convertDataElementsValues } from "../metaData";
import { convertValue } from "../converters/serverToClient";
import { getSubValues } from "./getSubValues";

function getValuesById(apiAttributeValues) {
    if (!apiAttributeValues) {
        return apiAttributeValues;
    }

    return apiAttributeValues.reduce((accValues, attrValue) => {
        accValues[attrValue.attribute] = attrValue.value;
        return accValues;
    }, {});
}

// $FlowFixMe[cannot-resolve-name] automated comment
async function convertToClientTei(apiTei, attributes) {
    const attributeValuesById = getValuesById(apiTei.attributes);
    const convertedAttributeValues = convertDataElementsValues(attributeValuesById, attributes, convertValue);

    await getSubValues(apiTei.trackedEntity, attributes, convertedAttributeValues);

    return {
        id: apiTei.trackedEntity,
        tei: apiTei,
        values: convertedAttributeValues,
    };
}

export async function getTrackedEntityInstances(queryParams, attributes) {
    const api = getApi();
    const apiRes = await api.get("tracker/trackedEntities", queryParams);

    const trackedEntityInstanceContainers =
        apiRes && apiRes.instances
            ? await apiRes.instances.reduce(async (accTeiPromise, apiTei) => {
                  const accTeis = await accTeiPromise;
                  const teiContainer = await convertToClientTei(apiTei, attributes);
                  if (teiContainer) {
                      accTeis.push(teiContainer);
                  }
                  return accTeis;
              }, Promise.resolve([]))
            : null;

    const pagingData = {
        rowsPerPage: queryParams.pageSize,
        currentPage: queryParams.page,
    };

    return {
        trackedEntityInstanceContainers,
        pagingData,
    };
}
