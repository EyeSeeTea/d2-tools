//
import * as React from "react";
import { Button as D2Button } from "@dhis2/ui";

export const Button = props => {
    const { ...passOnProps } = props;
    return <D2Button {...passOnProps} />;
};
