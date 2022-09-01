//
import { getDefaultFormField } from "./defaultFormFieldGetter";
import { getCustomFormField } from "./customFormFieldGetter";
import {} from "../../../metaData";

// $FlowFixMe[cannot-resolve-name] automated comment
export function buildField(metaData, options, useCustomFormFields) {
    return useCustomFormFields
        ? getCustomFormField(metaData, options)
        : getDefaultFormField(metaData, options);
}
