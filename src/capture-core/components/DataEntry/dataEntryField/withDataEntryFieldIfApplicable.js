//
import * as React from "react";
import { withDataEntryField } from "./withDataEntryField";

const getDataEntryFieldIfApplicable = (settings, InnerComponent) =>
    class DataEntryFieldIfApplicableHOC extends React.Component {
        constructor(props) {
            super(props);
            const applicable = settings.isApplicable(this.props);
            if (applicable) {
                // $FlowFixMe
                this.Component = withDataEntryField(settings)(InnerComponent);
            } else {
                this.Component = InnerComponent;
            }
        }

        render() {
            const Component = this.Component;
            return <Component {...this.props} />;
        }
    };

export const withDataEntryFieldIfApplicable = settings => InnerComponent =>
    getDataEntryFieldIfApplicable(settings, InnerComponent);
