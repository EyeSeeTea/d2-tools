//
import { createFieldConfig, createProps } from "../base/configBaseDefaultForm";
import { TextRangeFieldForForm } from "../../Components";

export const getTextRangeFieldConfig = (metaData, options, extraProps) => {
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
            component: TextRangeFieldForForm,
            props,
        },
        metaData
    );
};
