//
import * as React from "react";
import isFunction from "d2-utilizr/lib/isFunction";

export const withDefaultShouldUpdateInterface = () => InnerComponent =>
    class ShouldFieldUpdateInterface extends React.Component {
        shouldComponentUpdate(nextProps) {
            return Object.keys(nextProps).some(
                propName => nextProps[propName] !== this.props[propName] && !isFunction(nextProps[propName])
            );
        }

        render() {
            return <InnerComponent {...this.props} />;
        }
    };
