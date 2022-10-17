//
import { createFieldConfig, createProps } from "../base/configBaseCustomForm";
import { UserNameFieldForCustomForm } from "../../Components";

export const getUserNameFieldConfigForCustomForm = metaData => {
    const props = createProps({}, metaData);

    return createFieldConfig(
        {
            component: UserNameFieldForCustomForm,
            props,
        },
        metaData
    );
};
