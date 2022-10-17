//
import { orientations } from "../../../../FormFields/New";
import { createFieldConfig, createProps } from "../base/configBaseCustomForm";
import { DateTimeFieldForCustomForm } from "../../Components";

export const getDateTimeFieldConfigForCustomForm = metaData => {
    const props = createProps(
        {
            dateWidth: "100%",
            dateMaxWidth: 350,
            calendarWidth: 350,
            orientation: orientations.HORIZONTAL,
            shrinkDisabled: false,
        },
        metaData
    );

    return createFieldConfig(
        {
            component: DateTimeFieldForCustomForm,
            props,
        },
        metaData
    );
};
