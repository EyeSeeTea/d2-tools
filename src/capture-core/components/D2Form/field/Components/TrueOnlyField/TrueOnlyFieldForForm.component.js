//
import {
    TrueOnlyField,
    withGotoInterface,
    withHideCompatibility,
    withDefaultShouldUpdateInterface,
    withFocusSaver,
    withCalculateMessages,
    withDefaultFieldContainer,
    withLabel,
    withDisplayMessages,
    withFilterProps,
} from "../../../../FormFields/New";
import { withRequiredFieldCalculation, withDisabledFieldCalculation } from "../internal";
import labelTypeClasses from "../../buildField.module.css";

const getFilteredProps = props => {
    const { formHorizontal, fieldLabelMediaBasedClass, ...passOnProps } = props;
    return passOnProps;
};

export const TrueOnlyFieldForForm = withGotoInterface()(
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
                                        `${props.fieldLabelMediaBasedClass} ${labelTypeClasses.trueOnlyLabel}`,
                                })(withFilterProps(getFilteredProps)(withDisplayMessages()(TrueOnlyField)))
                            )
                        )
                    )
                )
            )
        )
    )
);
