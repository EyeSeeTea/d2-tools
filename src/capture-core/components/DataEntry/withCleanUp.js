//
import * as React from "react";

const getCleanUpHOC = InnerComponent => props => {
    const { onSearchGroupResultCountRetrieved, onSearchGroupResultCountRetrievalFailed, ...passOnProps } =
        props;

    return <InnerComponent {...passOnProps} />;
};

export const withCleanUp = () => InnerComponent => getCleanUpHOC(InnerComponent);
