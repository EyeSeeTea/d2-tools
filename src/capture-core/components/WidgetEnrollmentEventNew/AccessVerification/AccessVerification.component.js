//
import React from "react";
import { OrgUnitFetcher } from "../OrgUnitFetcher/OrgUnitFetcher.component";
import { NoAccess } from "./NoAccess.component";

export const AccessVerificationComponent = ({ eventAccess, onCancel, ...passOnProps }) => {
    if (!eventAccess.write) {
        return <NoAccess onCancel={onCancel} />;
    }

    return <OrgUnitFetcher onCancel={onCancel} {...passOnProps} />;
};
