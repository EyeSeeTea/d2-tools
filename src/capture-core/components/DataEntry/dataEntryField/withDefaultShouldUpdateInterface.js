//
import * as React from "react";

export const withDefaultShouldUpdateInterface = () => InnerComponent =>
    class ShouldFieldUpdateInterface extends React.Component {
        shouldComponentUpdate(nextProps) {
            const pureCheck = ["value", "touched", "validationAttempted", "validationError"];
            // $FlowFixMe[prop-missing] automated comment
            return pureCheck.some(propName => nextProps[propName] !== this.props[propName]);
        }

        render() {
            return <InnerComponent {...this.props} />;
        }
    };
