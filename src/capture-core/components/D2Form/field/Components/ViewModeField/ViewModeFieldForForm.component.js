//
import {
    withDefaultFieldContainer,
    withLabel,
    withFilterProps,
    ViewModeField,
} from "../../../../FormFields/New";
import labelTypeClasses from "../../buildField.module.css";

const getFilteredProps = props => {
    const { formHorizontal, fieldLabelMediaBasedClass, ...passOnProps } = props;
    return passOnProps;
};

export const ViewModeFieldForForm = withDefaultFieldContainer()(
    withLabel({
        onGetUseVerticalOrientation: props => props.formHorizontal,
        onGetCustomFieldLabeClass: props =>
            `${props.fieldLabelMediaBasedClass} ${labelTypeClasses.viewModeLabel}`,
    })(withFilterProps(getFilteredProps)(ViewModeField))
);
