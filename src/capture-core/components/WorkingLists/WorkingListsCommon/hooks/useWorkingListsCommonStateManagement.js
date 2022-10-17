//
/* eslint-disable complexity */
import { useMemo, useCallback } from "react";
// $FlowFixMe
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
    selectTemplate,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    fetchTemplates,
    fetchTemplatesCancel,
    initListView,
    initListViewCancel,
    updateList,
    updateListCancel,
    unloadingContext,
    sortList,
    setListColumnOrder,
    setFilter,
    clearFilter,
    selectRestMenuItem,
    changePage,
    changeRowsPerPage,
    setTemplateSharingSettings,
} from "../actions";

const useTemplates = (dispatch, { storeId, workingListsType }) => {
    const templateState = useSelector(({ workingListsTemplates }) => {
        const {
            selectedTemplateId: currentTemplateId,
            templates,
            loading: templatesLoading,
            loadError: loadTemplatesError,
        } = workingListsTemplates[storeId] || {};

        return {
            currentTemplateId,
            templates,
            templatesLoading: !!templatesLoading,
            loadTemplatesError,
        };
    }, shallowEqual);

    const templateDispatch = useMemo(
        () => ({
            onSelectTemplate: (...args) => dispatch(selectTemplate(...args, storeId)),
            onLoadTemplates: (...args) => dispatch(fetchTemplates(...args, storeId, workingListsType)),
            onCancelLoadTemplates: () => dispatch(fetchTemplatesCancel(storeId)),
            onAddTemplate: (name, criteria, data) =>
                dispatch(
                    addTemplate(name, criteria, {
                        ...data,
                        storeId,
                        workingListsType,
                    })
                ),
            onUpdateTemplate: (template, criteria, data) =>
                dispatch(
                    updateTemplate(template, criteria, {
                        ...data,
                        storeId,
                        workingListsType,
                    })
                ),
            onDeleteTemplate: (...args) => dispatch(deleteTemplate(...args, { storeId, workingListsType })),
            onSetTemplateSharingSettings: (sharingSettings, templateId) =>
                dispatch(setTemplateSharingSettings(sharingSettings, templateId, storeId)),
        }),
        [storeId, dispatch, workingListsType]
    );

    return {
        ...templateState,
        ...templateDispatch,
    };
};

const useView = (dispatch, categoryCombinationId, { storeId, workingListsType }) => {
    const viewState = useSelector(
        ({
            workingLists,
            workingListsUI,
            workingListsMeta,
            workingListsColumnsOrder,
            workingListsStickyFilters,
            workingListsListRecords,
        }) => {
            const { order: recordsOrder } = workingLists[storeId] || {};

            const {
                isUpdating: updating,
                isLoading: loading,
                isUpdatingWithDialog: updatingWithDialog,
                dataLoadingError: loadViewError,
            } = workingListsUI[storeId] || {};

            const {
                rowsPerPage,
                currentPage,
                sortById,
                sortByDirection,
                initial,
                nextInitial,
                viewPreloaded,
                next: workingListsMetaNextStore,
            } = workingListsMeta[storeId] || {};

            const {
                rowsPerPage: nextRowsPerPage,
                currentPage: nextCurrentPage,
                sortById: nextSortById,
                sortByDirection: nextSortByDirection,
            } = workingListsMetaNextStore || {};

            return {
                records: workingListsListRecords[storeId],
                recordsOrder,
                updating: !!updating,
                loading: !!loading,
                updatingWithDialog: !!updatingWithDialog,
                loadViewError,
                customColumnOrder: workingListsColumnsOrder[storeId],
                stickyFilters: workingListsStickyFilters[storeId],
                rowsPerPage: nextRowsPerPage || rowsPerPage,
                currentPage: nextCurrentPage || currentPage,
                sortById: nextSortById || sortById,
                sortByDirection: nextSortByDirection || sortByDirection,
                initialViewConfig: nextInitial || initial,
                viewPreloaded,
            };
        },
        shallowEqual
    );

    const appliedFilters = useSelector(
        ({ workingListsMeta }) => workingListsMeta[storeId] && workingListsMeta[storeId].filters
    );

    const nextFilters = useSelector(
        ({ workingListsMeta }) =>
            workingListsMeta[storeId] &&
            workingListsMeta[storeId].next &&
            workingListsMeta[storeId].next.filters
    );
    const filtersState = useMemo(
        () => ({ ...appliedFilters, ...nextFilters }),
        [appliedFilters, nextFilters]
    );

    const viewDispatch = useMemo(
        () => ({
            onLoadView: (selectedTemplate, context, meta) =>
                dispatch(
                    initListView(selectedTemplate, context, {
                        ...meta,
                        categoryCombinationId,
                        storeId,
                        workingListsType,
                    })
                ),
            onUpdateList: (queryArgs, meta) =>
                dispatch(
                    updateList(queryArgs, {
                        ...meta,
                        categoryCombinationId,
                        storeId,
                        workingListsType,
                    })
                ),
            onCancelLoadView: () => dispatch(initListViewCancel(storeId)),
            onCancelUpdateList: () => dispatch(updateListCancel(storeId)),
            onSortList: (...args) => dispatch(sortList(...args, storeId)),
            onSetListColumnOrder: (...args) => dispatch(setListColumnOrder(...args, storeId)),
            onUpdateFilter: (...args) => dispatch(setFilter(...args, storeId)),
            onClearFilter: (...args) => dispatch(clearFilter(...args, storeId)),
            onSelectRestMenuItem: (...args) => dispatch(selectRestMenuItem(...args, storeId)),
            onChangePage: (...args) => dispatch(changePage(...args, storeId)),
            onChangeRowsPerPage: (...args) => dispatch(changeRowsPerPage(...args, storeId)),
        }),
        [storeId, dispatch, categoryCombinationId, workingListsType]
    );

    return {
        ...viewState,
        filters: filtersState,
        ...viewDispatch,
    };
};

const useWorkingListsContext = (dispatch, { storeId }) => {
    const currentContextState = useSelector(
        ({ currentSelections: { orgUnitId, categories }, offline: { lastTransaction } }) => ({
            orgUnitId,
            categories,
            lastTransaction,
        }),
        shallowEqual
    );

    const { listDataRefreshTimestamp, lastTransactionOnListDataRefresh, ...loadedContext } =
        useSelector(({ workingListsContext }) => workingListsContext[storeId]) || {};
    const onUnloadingContext = useCallback(() => dispatch(unloadingContext(storeId)), [dispatch, storeId]);

    return {
        ...currentContextState,
        loadedContext,
        onUnloadingContext,
        listDataRefreshTimestamp,
        lastTransactionOnListDataRefresh,
    };
};

export const useWorkingListsCommonStateManagement = (storeId, workingListsType, program) => {
    const dispatch = useDispatch();
    const context = useWorkingListsContext(dispatch, { storeId, workingListsType });
    const templates = useTemplates(dispatch, { storeId, workingListsType });
    const view = useView(dispatch, program.categoryCombination && program.categoryCombination.id, {
        storeId,
        workingListsType,
    });

    return {
        ...templates,
        ...view,
        ...context,
    };
};
