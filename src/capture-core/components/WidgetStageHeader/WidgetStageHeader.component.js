//
import React from "react";
import { spacersNum } from "@dhis2/ui";
import withStyles from "@material-ui/core/styles/withStyles";
import { NonBundledDhis2Icon } from "../NonBundledDhis2Icon";

const styles = () => ({
    wrapper: {
        paddingLeft: spacersNum.dp16,
    },
    header: {
        display: "flex",
        alignItems: "center",
        padding: spacersNum.dp8,
    },
    icon: {
        paddingRight: spacersNum.dp8,
    },
});

const WidgetStageHeaderPlain = ({ stage, classes }) => (
    <div className={classes.header}>
        {stage?.icon && (
            <div className={classes.icon}>
                <NonBundledDhis2Icon
                    name={stage?.icon?.name}
                    color={stage?.icon?.color}
                    width={30}
                    height={30}
                    cornerRadius={2}
                />
            </div>
        )}
        <span>{stage?.name}</span>
    </div>
);

export const WidgetStageHeader = withStyles(styles)(WidgetStageHeaderPlain);
