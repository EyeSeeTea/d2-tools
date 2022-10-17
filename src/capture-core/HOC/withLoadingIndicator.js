//
import * as React from "react";

import { LoadingMaskElementCenter } from "../components/LoadingMasks";

export const withLoadingIndicator =
    (getContainerStylesFn, getIndicatorProps, readyFn) => InnerComponent => props => {
        const { ready, ...other } = props;
        const isReady = readyFn ? readyFn(props) : ready;
        if (!isReady) {
            const containerStyles = getContainerStylesFn ? getContainerStylesFn(props) : null;
            const indicatorProps = getIndicatorProps ? getIndicatorProps(props) : null;
            return <LoadingMaskElementCenter containerStyle={containerStyles} {...indicatorProps} />;
        }

        return <InnerComponent {...other} />;
    };
