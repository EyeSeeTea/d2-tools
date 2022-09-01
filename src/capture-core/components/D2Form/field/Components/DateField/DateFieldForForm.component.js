//
import {
    DateField,
    withGotoInterface,
    withHideCompatibility,
    withDefaultShouldUpdateInterface,
    withFocusSaver,
    withCalculateMessages,
    withDefaultFieldContainer,
    withLabel,
    withDisplayMessages,
    withFilterProps,
    withInternalChangeHandler,
} from "../../../../FormFields/New";
import { withRequiredFieldCalculation, withDisabledFieldCalculation } from "../internal";
import labelTypeClasses from "../../buildField.module.css";

const getFilteredProps = props => {
    const { formHorizontal, fieldLabelMediaBasedClass, ...passOnProps } = props;
    return passOnProps;
};

export const DateFieldForForm = withGotoInterface()(
    withHideCompatibility()(
        withDefaultShouldUpdateInterface()(
            withDisabledFieldCalculation()(
                withRequiredFieldCalculation()(
                    withCalculateMessages()(
                        withFocusSaver()(
                            withDefaultFieldContainer()(
                                withLabel({
                                    onGetUseVerticalOrientation: props => props.formHorizontal,
                                    onGetCustomFieldLabeClass: props =>
                                        `${props.fieldLabelMediaBasedClass} ${labelTypeClasses.dateLabel}`,
                                })(
                                    withDisplayMessages()(
                                        withFilterProps(getFilteredProps)(
                                            withInternalChangeHandler()(DateField)
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    )
);
