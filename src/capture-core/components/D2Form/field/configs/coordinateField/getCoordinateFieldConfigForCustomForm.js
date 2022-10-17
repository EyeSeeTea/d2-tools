//
import { orientations } from "../../../../FormFields/New";
import { createFieldConfig, createProps } from "../base/configBaseCustomForm";
import { CoordinateFieldForCustomForm } from "../../Components";

export const getCoordinateFieldConfigForCustomForm = metaData => {
    const props = createProps(
        {
            orientation: orientations.HORIZONTAL,
            shrinkDisabled: false,
        },
        metaData
    );

    return createFieldConfig(
        {
            component: CoordinateFieldForCustomForm,
            props,
        },
        metaData
    );
};
