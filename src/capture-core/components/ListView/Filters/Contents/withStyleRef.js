//
import * as React from "react";

export const withStyleRef = () => InnerComponent => props =>
    (
        // $FlowFixMe[cannot-spread-inexact] automated comment
        <InnerComponent innerRef={props.filterTypeRef} {...props} />
    );
