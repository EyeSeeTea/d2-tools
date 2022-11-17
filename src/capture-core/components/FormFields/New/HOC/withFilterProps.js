//
import * as React from "react";

export const withFilterProps = filter => InnerComponent => props => {
    const passOnProps = filter(props);

    return <InnerComponent {...passOnProps} />;
};
