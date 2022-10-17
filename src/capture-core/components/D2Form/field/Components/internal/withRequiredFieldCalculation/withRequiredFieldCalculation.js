//
import * as React from "react";

export const withRequiredFieldCalculation = () => InnerComponent =>
    class RequiredFieldCalculationHOC extends React.Component {
        render() {
            const { metaCompulsory, rulesCompulsory, ...passOnProps } = this.props;

            return (
                // $FlowFixMe[cannot-spread-inexact] automated comment
                <InnerComponent required={!!(metaCompulsory || rulesCompulsory)} {...passOnProps} />
            );
        }
    };
