//
import { createFieldConfig, createProps } from "../base/configBaseCustomForm";
import { OrgUnitFieldForCustomForm } from "../../Components";

export const getOrgUnitFieldConfigForCustomForm = metaData => {
    const props = createProps({}, metaData);

    return createFieldConfig(
        {
            component: OrgUnitFieldForCustomForm,
            props,
        },
        metaData
    );
};
