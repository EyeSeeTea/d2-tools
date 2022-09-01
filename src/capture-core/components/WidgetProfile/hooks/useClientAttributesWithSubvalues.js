//
import { useState, useCallback, useEffect } from "react";
import { useDataEngine } from "@dhis2/app-runtime";
import { makeQuerySingleResource } from "capture-core/utils/api";
import { convertValue as convertServerToClient } from "../../../converters/serverToClient";
import { subValueGetterByElementType } from "./getSubValueForTei";

export const useClientAttributesWithSubvalues = (program, trackedEntityInstanceAttributes) => {
    const dataEngine = useDataEngine();

    const [listAttributes, setListAttributes] = useState([]);

    const getListAttributes = useCallback(async () => {
        if (program && trackedEntityInstanceAttributes) {
            const querySingleResource = makeQuerySingleResource(dataEngine.query.bind(dataEngine));
            const { programTrackedEntityAttributes } = program;
            const computedAttributes = await programTrackedEntityAttributes.reduce(
                async (promisedAcc, currentTEA) => {
                    const {
                        displayInList,
                        trackedEntityAttribute: { id, displayName, optionSet, valueType, unique },
                    } = currentTEA;
                    const foundAttribute = trackedEntityInstanceAttributes?.find(
                        item => item.attribute === id
                    );
                    let value;
                    if (foundAttribute) {
                        if (subValueGetterByElementType[valueType]) {
                            value = await subValueGetterByElementType[valueType](
                                foundAttribute.value,
                                querySingleResource
                            );
                        } else {
                            // $FlowFixMe dataElementTypes flow error
                            value = convertServerToClient(foundAttribute.value, valueType);
                        }
                    }

                    const acc = await promisedAcc;

                    return [
                        ...acc,
                        {
                            attribute: id,
                            key: displayName,
                            optionSet,
                            displayInList,
                            value,
                            unique,
                            valueType,
                        },
                    ];
                },
                Promise.resolve([])
            );

            setListAttributes(computedAttributes);
        }
    }, [program, trackedEntityInstanceAttributes, dataEngine]);

    useEffect(() => {
        getListAttributes();
    }, [getListAttributes]);

    return listAttributes;
};
