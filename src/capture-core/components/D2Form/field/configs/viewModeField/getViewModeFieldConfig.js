//
import { pipe } from "capture-core-utils";

import { ViewModeFieldForForm } from "../../Components";
import { convertFormToClient, convertClientToView } from "../../../../../converters";

const convertFn = pipe(convertFormToClient, convertClientToView);

const baseComponentStyles = {
    labelContainerStyle: {
        flexBasis: 200,
    },
    inputContainerStyle: {
        flexBasis: 150,
    },
};

export const getViewModeFieldConfig = (dataElement, options) => {
    const props = {
        valueConverter: value => dataElement.convertValue(value, convertFn),
        styles: baseComponentStyles,
        label: dataElement.formName,
        dataElement,
        fieldLabelMediaBasedClass: options.fieldLabelMediaBasedClass,
    };

    return {
        id: dataElement.id,
        component: ViewModeFieldForForm,
        props,
    };
};
