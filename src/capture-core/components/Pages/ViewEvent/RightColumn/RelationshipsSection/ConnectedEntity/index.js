//
import * as React from "react";
import { TrackedEntityInstance } from "./TrackedEntityInstance";

const types = {
    TRACKED_ENTITY_INSTANCE: "TRACKED_ENTITY_INSTANCE",
};

/**
 * Show name / link for the connected entity
 * @param {Object} props Passed in props
 */
export const ConnectedEntity = props => {
    const { type, ...passOnProps } = props;

    if (type !== types.TRACKED_ENTITY_INSTANCE) {
        return <React.Fragment>{props.name}</React.Fragment>;
    }
    return (
        // $FlowFixMe[prop-missing] automated comment
        <TrackedEntityInstance {...passOnProps} />
    );
};
