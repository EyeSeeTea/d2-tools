//
import { createFieldConfig, createProps } from "../base/configBaseDefaultForm";
import { UserNameFieldForForm } from "../../Components";

export const getUserNameFieldConfig = (metaData, options) => {
    const props = createProps(
        {
            formHorizontal: options.formHorizontal,
            fieldLabelMediaBasedClass: options.fieldLabelMediaBasedClass,
            usernameOnlyMode: true,
        },
        options,
        metaData
    );

    return createFieldConfig(
        {
            component: UserNameFieldForForm,
            props,
        },
        metaData
    );
};
