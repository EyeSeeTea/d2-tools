//
import React, { useState, useCallback } from "react";
import i18n from "@dhis2/d2-i18n";
import { Widget } from "../Widget";
import { Stages } from "./Stages";

export const WidgetStagesAndEvents = ({ className, stages, events, ...passOnProps }) => {
    const [open, setOpenStatus] = useState(true);
    return (
        <div data-test="stages-and-events-widget" className={className}>
            <Widget
                header={i18n.t("Stages and Events")}
                onOpen={useCallback(() => setOpenStatus(true), [setOpenStatus])}
                onClose={useCallback(() => setOpenStatus(false), [setOpenStatus])}
                open={open}
            >
                <Stages
                    stages={stages}
                    ready={events !== undefined && stages !== undefined}
                    events={events}
                    {...passOnProps}
                />
            </Widget>
        </div>
    );
};
