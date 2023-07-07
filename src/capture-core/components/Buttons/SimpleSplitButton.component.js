//
import * as React from "react";
import { SplitButton, Menu, MenuItem } from "@dhis2/ui";
import uuid from "uuid/v4";

export const SimpleSplitButton = props => {
    const { dropDownItems, ...passOnProps } = props;
    return (
        // $FlowFixMe[cannot-spread-inexact] automated comment
        <SplitButton
            component={
                <Menu>
                    {dropDownItems.map(i => (
                        <MenuItem key={uuid()} label={i.text} value={i.text} onClick={i.onClick} />
                    ))}
                </Menu>
            }
            {...passOnProps}
        />
    );
};
