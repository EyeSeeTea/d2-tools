//
import { orientations } from "../../../../FormFields/New";
import { createFieldConfig, createProps } from "../base/configBaseDefaultForm";
import { PolygonFieldForForm } from "../../Components";

export const getPolygonFieldConfig = (metaData, options) => {
    const props = createProps(
        {
            formHorizontal: options.formHorizontal,
            fieldLabelMediaBasedClass: options.fieldLabelMediaBasedClass,
            orientation: options.formHorizontal ? orientations.VERTICAL : orientations.HORIZONTAL,
            shrinkDisabled: options.formHorizontal,
            dialogLabel: metaData.formName,
        },
        options,
        metaData
    );

    return createFieldConfig(
        {
            component: PolygonFieldForForm,
            props,
        },
        metaData
    );
};
