//
import moment from "moment";
import { createFieldConfig, createProps } from "../base/configBaseDefaultForm";
import { DateFieldForForm } from "../../Components";

const getCalendarAnchorPosition = formHorizontal => (formHorizontal ? "center" : "left");

export const getDateFieldConfig = (metaData, options) => {
    const props = createProps(
        {
            formHorizontal: options.formHorizontal,
            fieldLabelMediaBasedClass: options.fieldLabelMediaBasedClass,
            width: options.formHorizontal ? 150 : "100%",
            maxWidth: options.formHorizontal ? 150 : 350,
            calendarWidth: options.formHorizontal ? 250 : 350,
            popupAnchorPosition: getCalendarAnchorPosition(options.formHorizontal),
            calendarMaxMoment: !metaData.allowFutureDate ? moment() : undefined,
        },
        options,
        metaData
    );

    return createFieldConfig(
        {
            component: DateFieldForForm,
            props,
        },
        metaData
    );
};
