//
import * as React from "react";

const getStyledContainerHOC = (InnerComponent, getStyles) =>
    class StyledContainerHOC extends React.Component {
        render() {
            const { ...passOnProps } = this.props;

            return (
                <div style={getStyles(this.props)}>
                    <InnerComponent {...passOnProps} />
                </div>
            );
        }
    };

export const withStyledContainer = getStyles => InnerComponent =>
    getStyledContainerHOC(InnerComponent, getStyles);
