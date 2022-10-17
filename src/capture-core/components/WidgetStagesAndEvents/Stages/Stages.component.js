//
import React from "react";
import { compose } from "redux";
import { withStyles } from "@material-ui/core";
import { Stage } from "./Stage";

import { withLoadingIndicator } from "../../../HOC";

const styles = {};
export const StagesPlain = ({ stages, events, classes, ...passOnProps }) => (
    <>
        {stages.map(stage => (
            <Stage
                // $FlowFixMe
                events={events?.filter(event => event.programStage === stage.id)}
                key={stage.id}
                stage={stage}
                className={classes.stage}
                {...passOnProps}
            />
        ))}
    </>
);

export const Stages = compose(withLoadingIndicator(), withStyles(styles))(StagesPlain);
