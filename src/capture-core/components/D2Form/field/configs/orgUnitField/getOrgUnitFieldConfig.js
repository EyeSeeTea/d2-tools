//
import { createFieldConfig, createProps } from "../base/configBaseDefaultForm";
import { OrgUnitFieldForForm } from "../../Components";

export const getOrgUnitFieldConfig = (metaData, options) => {
    const props = createProps(
        {
            formId: options.formId,
            elementId: metaData.id,
            formHorizontal: options.formHorizontal,
            fieldLabelMediaBasedClass: options.fieldLabelMediaBasedClass,
            maxTreeHeight: 200,
        },
        options,
        metaData
    );

    return createFieldConfig(
        {
            component: OrgUnitFieldForForm,
            props,
        },
        metaData
    );
};
