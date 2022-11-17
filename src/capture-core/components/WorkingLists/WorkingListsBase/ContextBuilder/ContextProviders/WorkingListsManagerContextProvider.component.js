//
import React, { useMemo } from "react";
import { ManagerContext } from "../../workingListsBase.context";

export const WorkingListsManagerContextProvider = ({ currentTemplate, onSelectTemplate, children }) => {
    const managerContextData = useMemo(
        () => ({
            currentTemplate,
            onSelectTemplate,
        }),
        [currentTemplate, onSelectTemplate]
    );

    return <ManagerContext.Provider value={managerContextData}>{children}</ManagerContext.Provider>;
};
