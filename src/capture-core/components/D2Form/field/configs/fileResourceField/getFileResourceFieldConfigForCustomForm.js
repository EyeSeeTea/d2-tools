//
import { orientations } from "../../../../FormFields/New";
import { createFieldConfig, createProps } from "../base/configBaseCustomForm";
import { FileResourceFieldForCustomForm } from "../../Components";

export const getFileResourceFieldConfigForCustomForm = metaData => {
    const props = createProps(
        {
            async: true,
            orientation: orientations.HORIZONTAL,
        },
        metaData
    );

    return createFieldConfig(
        {
            component: FileResourceFieldForCustomForm,
            props,
        },
        metaData
    );
};
