//
import * as React from "react";
import {
    withDefaultShouldUpdateInterface,
    withDefaultFieldContainer,
    withLabel,
    withInternalChangeHandler,
    withFilterProps,
    SingleOrgUnitSelectField,
    withOrgUnitFieldImplicitRootsFilterHandler,
    orgUnitFieldScopes,
} from "../../../../../FormFields/New";

const OrgUnitFieldImplicitRootsFilterHandlerHOC =
    withOrgUnitFieldImplicitRootsFilterHandler()(SingleOrgUnitSelectField);

class OrgUnitFieldWrapper extends React.Component {
    render() {
        const { onUpdateSelectedOrgUnit, ...passOnProps } = this.props;
        return (
            // $FlowFixMe[cannot-spread-inexact] automated comment
            <OrgUnitFieldImplicitRootsFilterHandlerHOC
                onSelect={onUpdateSelectedOrgUnit}
                scope={orgUnitFieldScopes.USER_CAPTURE}
                maxTreeHeight={200}
                {...passOnProps}
            />
        );
    }
}

export const ComposedRegUnitSelector = withDefaultShouldUpdateInterface()(
    withDefaultFieldContainer()(
        withLabel({
            onGetUseVerticalOrientation: props => props.formHorizontal,
            onGetCustomFieldLabeClass: props => props.labelClass,
        })(
            withFilterProps(props => {
                const { labelClass, ...passOnProps } = props;
                return passOnProps;
            })(withInternalChangeHandler()(OrgUnitFieldWrapper))
        )
    )
);
