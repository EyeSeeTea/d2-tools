//
import { useState, useEffect, useRef, useCallback } from "react";
import { useDataEngine } from "@dhis2/app-runtime";
import { makeQuerySingleResource } from "capture-core/utils/api";

import { getUniqueValuesForAttributesWithoutValue } from "../../common/TEIAndEnrollment";

import { convertClientToForm, convertServerToClient } from "../../../../converters";
import { subValueGetterByElementType } from "./getSubValueForTei";

const useClientAttributesWithSubvalues = (program, attributes) => {
    const dataEngine = useDataEngine();
    const [listAttributes, setListAttributes] = useState([]);

    const getListAttributes = useCallback(async () => {
        if (program && attributes) {
            const querySingleResource = makeQuerySingleResource(dataEngine.query.bind(dataEngine));
            const { attributes: programTrackedEntityAttributes } = program;
            const computedAttributes = await programTrackedEntityAttributes?.reduce(
                async (promisedAcc, programTrackedEntityAttribute) => {
                    const { id, formName, optionSet, type, unique } = programTrackedEntityAttribute;
                    const foundAttribute = attributes?.find(item => item.attribute === id);
                    let value;
                    if (foundAttribute) {
                        if (subValueGetterByElementType[type]) {
                            value = await subValueGetterByElementType[type](
                                foundAttribute.value,
                                querySingleResource
                            );
                        } else {
                            // $FlowFixMe dataElementTypes flow error
                            value = convertServerToClient(foundAttribute.value, type);
                        }
                    }

                    const acc = await promisedAcc;
                    return [
                        ...acc,
                        {
                            attribute: id,
                            key: formName,
                            optionSet,
                            value,
                            unique,
                            valueType: type,
                        },
                    ];
                },
                Promise.resolve([])
            );
            setListAttributes(computedAttributes);
        } else {
            setListAttributes([]);
        }
    }, [program, attributes, dataEngine]);

    useEffect(() => {
        getListAttributes();
    }, [getListAttributes]);

    return listAttributes;
};

const buildFormValues = async (
    foundation,
    clientAttributesWithSubvalues,
    staticPatternValues,
    setFormValues,
    setClientValues,
    formValuesReadyRef
) => {
    const clientValues = clientAttributesWithSubvalues?.reduce(
        (acc, currentValue) => ({ ...acc, [currentValue.attribute]: currentValue.value }),
        {}
    );
    const formValues = clientAttributesWithSubvalues?.reduce(
        (acc, currentValue) => ({
            ...acc,
            [currentValue.attribute]: convertClientToForm(currentValue.value, currentValue.valueType),
        }),
        {}
    );
    const uniqueValues = await getUniqueValuesForAttributesWithoutValue(
        foundation,
        clientAttributesWithSubvalues,
        staticPatternValues
    );
    setFormValues && setFormValues({ ...formValues, ...uniqueValues });
    setClientValues && setClientValues({ ...clientValues, ...uniqueValues });
    formValuesReadyRef.current = true;
};

export const useFormValues = ({
    program,
    trackedEntityInstanceAttributes,
    orgUnit,
    formFoundation,
    teiId,
}) => {
    const clientAttributesWithSubvalues = useClientAttributesWithSubvalues(
        program,
        trackedEntityInstanceAttributes
    );
    const formValuesReadyRef = useRef(false);
    const [formValues, setFormValues] = useState({});
    const [clientValues, setClientValues] = useState({});
    const areAttributesWithSubvaluesReady =
        (teiId && clientAttributesWithSubvalues.length > 0) ||
        (!teiId && clientAttributesWithSubvalues.length === 0);

    useEffect(() => {
        formValuesReadyRef.current = false;
    }, [teiId]);

    useEffect(() => {
        if (
            orgUnit?.code &&
            Object.entries(formFoundation).length > 0 &&
            formValuesReadyRef.current === false &&
            areAttributesWithSubvaluesReady
        ) {
            const staticPatternValues = { orgUnitCode: orgUnit.code };
            buildFormValues(
                formFoundation,
                clientAttributesWithSubvalues,
                staticPatternValues,
                setFormValues,
                setClientValues,
                formValuesReadyRef
            );
        }
    }, [
        formFoundation,
        clientAttributesWithSubvalues,
        formValuesReadyRef,
        orgUnit,
        areAttributesWithSubvaluesReady,
    ]);

    return { formValues, clientValues, formValuesReadyRef };
};
