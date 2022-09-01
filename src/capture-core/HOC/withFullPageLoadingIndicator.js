//
import * as React from "react";
import { LoadingMaskForPage } from "../components/LoadingMasks";

export const withLoadingIndicator = readyFn => InnerComponent => props => {
    const { ready, ...other } = props;
    const isReady = readyFn ? readyFn(props) : ready;
    if (!isReady) {
        return <LoadingMaskForPage />;
    }

    return <InnerComponent {...other} />;
};
