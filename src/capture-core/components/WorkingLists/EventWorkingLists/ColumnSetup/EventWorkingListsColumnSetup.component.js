//
import React, { useCallback } from "react";
import { useColumns } from "../../WorkingListsCommon";
import { useDefaultColumnConfig } from "../../EventWorkingListsCommon";
import { CurrentViewChangesResolver } from "../CurrentViewChangesResolver";

const useInjectColumnMetaToLoadList = (defaultColumns, onLoadView) =>
    useCallback(
        (selectedTemplate, context, meta) => {
            const columnsMetaForDataFetching = new Map(
                defaultColumns
                    // $FlowFixMe
                    .map(({ id, type, apiName, isMainProperty }) => [
                        id,
                        { id, type, apiName, isMainProperty },
                    ])
            );
            onLoadView(selectedTemplate, context, { ...meta, columnsMetaForDataFetching });
        },
        [onLoadView, defaultColumns]
    );

const useInjectColumnMetaToUpdateList = (defaultColumns, onUpdateList) =>
    useCallback(
        (queryArgs, lastTransaction) => {
            const columnsMetaForDataFetching = new Map(
                defaultColumns
                    // $FlowFixMe
                    .map(({ id, type, apiName, isMainProperty }) => [
                        id,
                        { id, type, apiName, isMainProperty },
                    ])
            );
            onUpdateList(queryArgs, { columnsMetaForDataFetching, lastTransaction });
        },
        [onUpdateList, defaultColumns]
    );

export const EventWorkingListsColumnSetup = ({
    program,
    programStage,
    customColumnOrder,
    onLoadView,
    onUpdateList,
    ...passOnProps
}) => {
    const defaultColumns = useDefaultColumnConfig(programStage);
    const injectColumnMetaToLoadList = useInjectColumnMetaToLoadList(defaultColumns, onLoadView);
    const injectColumnMetaToUpdateList = useInjectColumnMetaToUpdateList(defaultColumns, onUpdateList);
    const columns = useColumns(customColumnOrder, defaultColumns);

    return (
        <CurrentViewChangesResolver
            {...passOnProps}
            program={program}
            programStageId={programStage.id}
            columns={columns}
            defaultColumns={defaultColumns}
            onLoadView={injectColumnMetaToLoadList}
            onUpdateList={injectColumnMetaToUpdateList}
        />
    );
};
