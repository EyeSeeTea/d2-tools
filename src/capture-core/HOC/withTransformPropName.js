//
import * as React from "react";

export const withTransformPropName = fromToPropNames => InnerComponent => props => {
    const [fromName, toName] = fromToPropNames;
    const transformedProp = {
        [toName]: props[fromName],
    };

    const passOnProps = {
        ...props,
    };
    passOnProps[fromName] && delete passOnProps[fromName];

    return <InnerComponent {...passOnProps} {...transformedProp} />;
};
