//
import moment from "moment";
import React, { useCallback } from "react";
import { WorkingListsBase } from "../../WorkingListsBase";

export const EventWorkingListsUpdateTrigger = ({
    lastTransaction,
    lastIdDeleted,
    listDataRefreshTimestamp,
    lastTransactionOnListDataRefresh,
    onLoadView,
    onUpdateList,
    ...passOnProps
}) => {
    const forceUpdateOnMount =
        moment().diff(moment(listDataRefreshTimestamp || 0), "minutes") > 5 ||
        lastTransaction !== lastTransactionOnListDataRefresh;

    // Creating a string that will force an update of the list when it changes.
    const customUpdateTrigger = [lastTransaction, lastIdDeleted].join("##");

    const injectCustomUpdateContextToLoadList = useCallback(
        (selectedTemplate, context, meta) =>
            onLoadView(selectedTemplate, { ...context, lastTransaction }, meta),
        [onLoadView, lastTransaction]
    );

    const injectCustomUpdateContextToUpdateList = useCallback(
        queryArgs => onUpdateList(queryArgs, lastTransaction),
        [onUpdateList, lastTransaction]
    );

    return (
        <WorkingListsBase
            {...passOnProps}
            customUpdateTrigger={customUpdateTrigger}
            forceUpdateOnMount={forceUpdateOnMount}
            onLoadView={injectCustomUpdateContextToLoadList}
            onUpdateList={injectCustomUpdateContextToUpdateList}
        />
    );
};
