//
import * as React from "react";

export const withHideCompatibility = () => InnerComponent =>
    class HideFieldCompatibilityInterface extends React.Component {
        render() {
            const { hidden, ...passOnProps } = this.props;

            if (hidden) {
                return null;
            }

            return <InnerComponent {...passOnProps} />;
        }
    };
