//
import React from "react";
import { WidgetCollapsible } from "./WidgetCollapsible.component";
import { WidgetNonCollapsible } from "./WidgetNonCollapsible.component";

export const Widget = ({ noncollapsible = false, ...passOnProps }) =>
    !noncollapsible ? (
        <div>
            {/* $FlowFixMe */}
            <WidgetCollapsible {...passOnProps} />
        </div>
    ) : (
        <div>
            {/* $FlowFixMe */}
            <WidgetNonCollapsible {...passOnProps} />
        </div>
    );
