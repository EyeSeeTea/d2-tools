//
import React, { useMemo } from "react";
import { ListViewConfigContext } from "../../workingListsBase.context";

export const WorkingListsListViewConfigContextProvider = ({
    currentViewHasTemplateChanges,
    onAddTemplate,
    onUpdateTemplate,
    onDeleteTemplate,
    children,
}) => {
    const listViewConfigContextData = useMemo(
        () => ({
            currentViewHasTemplateChanges,
            onAddTemplate,
            onUpdateTemplate,
            onDeleteTemplate,
        }),
        [currentViewHasTemplateChanges, onAddTemplate, onUpdateTemplate, onDeleteTemplate]
    );

    return (
        <ListViewConfigContext.Provider value={listViewConfigContextData}>
            {children}
        </ListViewConfigContext.Provider>
    );
};
