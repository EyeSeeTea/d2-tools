//
import { orientations } from "../../../../FormFields/New";
import { createFieldConfig, createProps } from "../base/configBaseDefaultForm";
import { TrueOnlyFieldForForm } from "../../Components";

export const getTrueOnlyFieldConfig = (metaData, options) => {
    const props = createProps(
        {
            formHorizontal: options.formHorizontal,
            fieldLabelMediaBasedClass: options.fieldLabelMediaBasedClass,
            orientation: options.formHorizontal ? orientations.VERTICAL : orientations.HORIZONTAL,
            id: metaData.id,
        },
        options,
        metaData
    );

    return createFieldConfig(
        {
            component: TrueOnlyFieldForForm,
            props,
        },
        metaData
    );
};
