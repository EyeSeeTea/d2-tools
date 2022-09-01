//
import { orientations } from "../../../../FormFields/New";
import { createFieldConfig, createProps } from "../base/configBaseDefaultForm";
import { FileResourceFieldForForm } from "../../Components";

export const getFileResourceFieldConfig = (metaData, options) => {
    const props = createProps(
        {
            formHorizontal: options.formHorizontal,
            fieldLabelMediaBasedClass: options.fieldLabelMediaBasedClass,
            async: true,
            orientation: options.formHorizontal ? orientations.VERTICAL : orientations.HORIZONTAL,
        },
        options,
        metaData
    );

    return createFieldConfig(
        {
            component: FileResourceFieldForForm,
            props,
        },
        metaData
    );
};
