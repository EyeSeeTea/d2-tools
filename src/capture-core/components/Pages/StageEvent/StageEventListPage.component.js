//
import React from "react";

import withStyles from "@material-ui/core/styles/withStyles";
import { spacersNum } from "@dhis2/ui";
import { compose } from "redux";

import { StageEventList } from "./StageEventList/StageEventList.component";
import { withErrorMessageHandler } from "../../../HOC";

const getStyles = () => ({
    container: {
        padding: `${spacersNum.dp16}px ${spacersNum.dp24}px`,
    },
});

const StageEventListPagePlain = ({ classes, programStage, ...passOnProps }) => (
    <>
        <div data-test="stage-event-list-page-content" className={classes.container}>
            <StageEventList stage={programStage} {...passOnProps} />
        </div>
    </>
);

export const StageEventListPageComponent = compose(
    withErrorMessageHandler(),
    withStyles(getStyles)
)(StageEventListPagePlain);
