//
import { pipe } from "capture-core-utils";

import { ViewModeFieldForCustomForm } from "../../Components";
import { convertFormToClient, convertClientToView } from "../../../../../converters";

const convertFn = pipe(convertFormToClient, convertClientToView);

export const getViewModeFieldConfigForCustomForm = (dataElement, options) => {
    const props = {
        valueConverter: value => dataElement.convertValue(value, convertFn),
        label: dataElement.formName,
        dataElement,
        fieldLabelMediaBasedClass: options.fieldLabelMediaBasedClass,
    };

    return {
        id: dataElement.id,
        component: ViewModeFieldForCustomForm,
        props,
    };
};
