//
import * as React from "react";

export const withDisabledFieldCalculation = () => InnerComponent =>
    class DisabledFieldCalculationHOC extends React.Component {
        render() {
            const { metaDisabled, rulesDisabled, ...passOnProps } = this.props;

            return (
                // $FlowFixMe[cannot-spread-inexact] automated comment
                <InnerComponent disabled={!!(metaDisabled || rulesDisabled)} {...passOnProps} />
            );
        }
    };
