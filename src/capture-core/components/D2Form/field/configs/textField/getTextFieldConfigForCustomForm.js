//
import { createFieldConfig, createProps } from "../base/configBaseCustomForm";
import { TextFieldForCustomForm } from "../../Components";

export const getTextFieldConfigForCustomForm = (metaData, extraProps) => {
    const props = createProps(
        {
            multiLine: extraProps && extraProps.multiLine,
        },
        metaData
    );

    return createFieldConfig(
        {
            component: TextFieldForCustomForm,
            props,
        },
        metaData
    );
};
