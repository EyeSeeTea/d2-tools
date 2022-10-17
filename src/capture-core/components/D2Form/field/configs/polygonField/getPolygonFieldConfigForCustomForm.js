//
import { orientations } from "../../../../FormFields/New";
import { createFieldConfig, createProps } from "../base/configBaseCustomForm";
import { PolygonFieldForCustomForm } from "../../Components";

export const getPolygonFieldConfigForCustomForm = metaData => {
    const props = createProps(
        {
            orientation: orientations.HORIZONTAL,
            shrinkDisabled: false,
        },
        metaData
    );

    return createFieldConfig(
        {
            component: PolygonFieldForCustomForm,
            props,
        },
        metaData
    );
};
