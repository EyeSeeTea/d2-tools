//
import * as React from "react";
import { connect } from "react-redux";

import { LoadingMaskForPage, LoadingMaskElementCenter } from "../components/LoadingMasks";

const getLoadingIndicator = (getContainerStylesFn, fullPage) => props => {
    const { ready, InnerComponent, ...other } = props;

    if (!ready) {
        if (fullPage) {
            return <LoadingMaskForPage />;
        }

        const containerStyles = getContainerStylesFn ? getContainerStylesFn(props) : null;
        return <LoadingMaskElementCenter containerStyle={containerStyles} />;
    }

    return <InnerComponent {...other} />;
};

export const withStateBoundLoadingIndicator =
    (isReadyFn, getContainerStylesFn, fullPage) => InnerComponent => {
        const mapStateToProps = (state, props) => ({
            ready: isReadyFn(state, props),
        });

        const mergeProps = (stateProps, dispatchProps, ownProps) =>
            Object.assign({}, ownProps, stateProps, dispatchProps, {
                InnerComponent,
            });

        // $FlowFixMe[speculation-ambiguous] automated comment
        const LoadingIndicatorContainer = connect(
            mapStateToProps,
            null,
            mergeProps
        )(getLoadingIndicator(getContainerStylesFn, fullPage));
        return LoadingIndicatorContainer;
    };
