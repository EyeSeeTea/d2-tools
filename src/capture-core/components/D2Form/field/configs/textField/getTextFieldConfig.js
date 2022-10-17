//
import { createFieldConfig, createProps } from "../base/configBaseDefaultForm";
import { TextFieldForForm } from "../../Components";

export const getTextFieldConfig = (metaData, options, context, extraProps) => {
    const props = createProps(
        {
            formHorizontal: options.formHorizontal,
            fieldLabelMediaBasedClass: options.fieldLabelMediaBasedClass,
            multiLine: extraProps && extraProps.multiLine,
        },
        options,
        metaData
    );

    return createFieldConfig(
        {
            component: TextFieldForForm,
            props,
        },
        metaData
    );
};
