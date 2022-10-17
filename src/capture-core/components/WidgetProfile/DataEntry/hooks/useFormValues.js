//
import { useState, useEffect, useRef } from "react";

import { getUniqueValuesForAttributesWithoutValue } from "../../../DataEntries/common/TEIAndEnrollment";

import { convertClientToForm } from "../../../../converters";

const buildFormValues = async (
    foundation,
    clientAttributesWithSubvalues = [],
    staticPatternValues,
    setFormValues,
    setClientValues
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
};

export const useFormValues = ({ formFoundation, orgUnit, clientAttributesWithSubvalues }) => {
    const [formValues, setFormValues] = useState({});
    const [clientValues, setClientValues] = useState({});
    const formValuesReadyRef = useRef(false);

    useEffect(() => {
        if (
            orgUnit &&
            orgUnit.code &&
            Object.entries(formFoundation).length > 0 &&
            Object.entries(formValues).length === 0 &&
            formValuesReadyRef.current === false
        ) {
            const staticPatternValues = { orgUnitCode: orgUnit.code };
            formValuesReadyRef.current = true;
            buildFormValues(
                formFoundation,
                clientAttributesWithSubvalues,
                staticPatternValues,
                setFormValues,
                setClientValues
            );
        }
    }, [formFoundation, clientAttributesWithSubvalues, formValues, formValuesReadyRef, orgUnit]);

    return { formValues, clientValues };
};
