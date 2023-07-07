//
import { orientations } from "../../../../FormFields/New";
import { createFieldConfig, createProps } from "../base/configBaseCustomForm";
import { TrueOnlyFieldForCustomForm } from "../../Components";

export const getTrueOnlyFieldConfigForCustomForm = metaData => {
    const props = createProps(
        {
            orientation: orientations.HORIZONTAL,
            id: metaData.id,
        },
        metaData
    );

    return createFieldConfig(
        {
            component: TrueOnlyFieldForCustomForm,
            props,
        },
        metaData
    );
};
