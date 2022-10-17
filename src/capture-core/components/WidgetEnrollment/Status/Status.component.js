//
import React from "react";
import { withStyles } from "@material-ui/core";
import { Tag, spacersNum } from "@dhis2/ui";
import { plainStatus, translatedStatus } from "../constants/status.const";

const styles = {
    status: {
        margin: spacersNum.dp4,
    },
};

export const StatusPlain = ({ status = "", classes }) => (
    <>
        <Tag
            className={classes.status}
            neutral={status === plainStatus.ACTIVE}
            negative={status === plainStatus.CANCELLED}
        >
            {translatedStatus[status] || status}
        </Tag>
    </>
);

export const Status = withStyles(styles)(StatusPlain);
