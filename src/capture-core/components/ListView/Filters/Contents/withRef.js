//
import * as React from "react";

export const withRef = () => InnerComponent => props => {
    const { filterTypeRef, ...passOnProps } = props;
    return (
        // $FlowFixMe[cannot-spread-inexact] automated comment
        <InnerComponent ref={filterTypeRef} {...passOnProps} />
    );
};
