//
import React, { useMemo } from "react";
import { useColumns } from "../../WorkingListsCommon";
import { useDefaultColumnConfig } from "../../EventWorkingListsCommon";
import { EventWorkingListsOfflineDataSourceSetup } from "../DataSourceSetup";

export const EventWorkingListsOfflineColumnSetup = ({ program, customColumnOrder, ...passOnProps }) => {
    const stage = program.stage;
    const defaultColumns = useDefaultColumnConfig(stage);
    const columns = useColumns(customColumnOrder, defaultColumns);
    const visibleColumns = useMemo(() => columns.filter(column => column.visible), [columns]);

    return <EventWorkingListsOfflineDataSourceSetup {...passOnProps} columns={visibleColumns} />;
};
