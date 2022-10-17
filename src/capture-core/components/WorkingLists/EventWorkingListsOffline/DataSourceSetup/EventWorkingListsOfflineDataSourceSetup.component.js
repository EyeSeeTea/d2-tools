//
import React from "react";
import { useDataSource } from "../../WorkingListsCommon";
import { createOfflineListWrapper } from "../../../List"; // TODO: Refactor list

const OfflineListWrapper = createOfflineListWrapper();

export const EventWorkingListsOfflineDataSourceSetup = ({
    eventRecords,
    columns,
    recordsOrder,
    ...passOnProps
}) => {
    const hasData = !!recordsOrder;

    return (
        <OfflineListWrapper
            {...passOnProps}
            hasData={hasData}
            dataSource={useDataSource(eventRecords, recordsOrder, columns)}
            columns={columns}
            rowIdKey="id"
        />
    );
};
