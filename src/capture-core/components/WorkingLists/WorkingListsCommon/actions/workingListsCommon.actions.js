//
import { actionCreator } from "../../../../actions/actions.utils";

export const workingListsCommonActionTypes = {
    TEMPLATES_FETCH: "WorkingListsTemplatesFetch",
    TEMPLATES_FETCH_SUCCESS: "WorkingListsTemplatesFetchSuccess",
    TEMPLATES_FETCH_ERROR: "WorkingListsTemplatesFetchError",
    TEMPLATES_FETCH_CANCEL: "WorkingListsTemplatesFetchCancel",
    TEMPLATE_SELECT: "WorkingListsTemplateSelect",
    TEMPLATE_ADD: "WorkingListsTemplateAdd",
    TEMPLATE_ADD_SUCCESS: "WorkingListsTemplateAddSuccess",
    TEMPLATE_ADD_ERROR: "WorkingListsTemplateAddError",
    TEMPLATE_DELETE: "WorkingListsTemplateDelete",
    TEMPLATE_DELETE_SUCCESS: "WorkingListsTemplateDeleteSuccess",
    TEMPLATE_DELETE_ERROR: "WorkingListsTemplateDeleteError",
    TEMPLATE_UPDATE: "WorkingListsTemplateUpdate",
    TEMPLATE_UPDATE_SUCCESS: "WorkingListsTemplateUpdateSuccess",
    TEMPLATE_UPDATE_ERROR: "WorkingListsTemplateUpdateError",
    LIST_VIEW_INIT: "WorkingListsListViewInit",
    LIST_VIEW_INIT_SUCCESS: "WorkingListsListViewInitSuccess",
    LIST_VIEW_INIT_ERROR: "WorkingListsListViewInitError",
    LIST_VIEW_INIT_CANCEL: "WorkingListsListViewInitCancel",
    LIST_UPDATE: "WorkingListsListUpdate",
    LIST_UPDATE_SUCCESS: "WorkingListsListUpdateSuccess",
    LIST_UPDATE_ERROR: "WorkingListsListUpdateError",
    LIST_UPDATE_CANCEL: "WorkingListsListUpdateCancel",
    CONTEXT_UNLOADING: "WorkingListsContextUnloading",
    LIST_SORT: "WorkingListsListSort",
    LIST_COLUMN_ORDER_SET: "WorkingListsListColumnOrderSet",
    FILTER_SET: "WorkingListsFilterSet",
    FILTER_CLEAR: "WorkingListsFilterClear",
    REST_MENU_ITEM_SELECT: "WorkingListsRestMenuItemSelect",
    STICKY_FILTERS_AFTER_COLUMN_SORTING_SET: "WorkingListsStickyFiltersAfterColumnSortingSet",
    PAGE_CHANGE: "WorkingListsPageChange",
    ROWS_PER_PAGE_CHANGE: "WorkingListsRowsPerPageChange",
    TEMPLATE_SHARING_SETTINGS_SET: "WorkingListsTemplateSharingSettingsSet",
};

export const fetchTemplates = (programId, storeId, workingListsType) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATES_FETCH)({ programId, storeId, workingListsType });

export const fetchTemplatesSuccess = (templates, defaultTemplateId, storeId) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATES_FETCH_SUCCESS)({
        templates,
        defaultTemplateId,
        storeId,
    });

export const fetchTemplatesError = (error, storeId) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATES_FETCH_ERROR)({ error, storeId });

export const fetchTemplatesCancel = storeId =>
    actionCreator(workingListsCommonActionTypes.TEMPLATES_FETCH_CANCEL)({ storeId });

export const selectTemplate = (templateId, storeId) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATE_SELECT)({ templateId, storeId });

export const updateTemplate = (template, criteria, data) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATE_UPDATE)({ template, criteria, ...data });

export const updateTemplateSuccess = (templateId, criteria, data) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATE_UPDATE_SUCCESS)({ templateId, criteria, ...data });

export const updateTemplateError = (templateId, criteria, data) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATE_UPDATE_ERROR)({ templateId, criteria, ...data });

export const addTemplate = (name, criteria, data) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATE_ADD)({ name, criteria, ...data });

export const addTemplateSuccess = (templateId, clientId, data) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATE_ADD_SUCCESS)({ templateId, clientId, ...data });

export const addTemplateError = (clientId, data) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATE_ADD_ERROR)({ clientId, ...data });

export const deleteTemplate = (template, programId, { storeId, workingListsType }) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATE_DELETE)({
        template,
        programId,
        storeId,
        workingListsType,
    });

export const deleteTemplateSuccess = (template, storeId) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATE_DELETE_SUCCESS)({ template, storeId });

export const deleteTemplateError = (template, storeId) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATE_DELETE_ERROR)({ template, storeId });

export const initListView = (selectedTemplate, context, meta) =>
    actionCreator(workingListsCommonActionTypes.LIST_VIEW_INIT)({ ...meta, selectedTemplate, context });

export const initListViewSuccess = (storeId, data) =>
    actionCreator(workingListsCommonActionTypes.LIST_VIEW_INIT_SUCCESS)({ ...data, storeId });

export const initListViewError = (storeId, errorMessage) =>
    actionCreator(workingListsCommonActionTypes.LIST_VIEW_INIT_ERROR)({ storeId, errorMessage });

export const initListViewCancel = storeId =>
    actionCreator(workingListsCommonActionTypes.LIST_VIEW_INIT_CANCEL)({ storeId });

export const updateList = (queryArgs, meta) =>
    actionCreator(workingListsCommonActionTypes.LIST_UPDATE)({ queryArgs, ...meta });

export const updateListSuccess = (storeId, data) =>
    actionCreator(workingListsCommonActionTypes.LIST_UPDATE_SUCCESS)({ ...data, storeId });

export const updateListError = (storeId, errorMessage) =>
    actionCreator(workingListsCommonActionTypes.LIST_UPDATE_ERROR)({ storeId, errorMessage });

export const updateListCancel = storeId =>
    actionCreator(workingListsCommonActionTypes.LIST_UPDATE_CANCEL)({ storeId });

export const unloadingContext = storeId =>
    actionCreator(workingListsCommonActionTypes.CONTEXT_UNLOADING)({ storeId });

export const sortList = (id, direction, storeId) =>
    actionCreator(workingListsCommonActionTypes.LIST_SORT)({ id, direction, storeId });

export const setListColumnOrder = (columns, storeId) =>
    actionCreator(workingListsCommonActionTypes.LIST_COLUMN_ORDER_SET)(
        { columns, storeId },
        { skipLogging: ["columns"] }
    );

export const setFilter = (filter, itemId, storeId) =>
    actionCreator(workingListsCommonActionTypes.FILTER_SET)({ filter, itemId, storeId });

export const clearFilter = (itemId, storeId) =>
    actionCreator(workingListsCommonActionTypes.FILTER_CLEAR)({ itemId, storeId });

export const selectRestMenuItem = (id, storeId) =>
    actionCreator(workingListsCommonActionTypes.REST_MENU_ITEM_SELECT)({ id, storeId });

export const setStickyFiltersAfterColumnSorting = (includeFilters, storeId) =>
    actionCreator(workingListsCommonActionTypes.STICKY_FILTERS_AFTER_COLUMN_SORTING_SET)({
        includeFilters,
        storeId,
    });

export const changePage = (pageNumber, storeId) =>
    actionCreator(workingListsCommonActionTypes.PAGE_CHANGE)({ pageNumber, storeId });

export const changeRowsPerPage = (rowsPerPage, storeId) =>
    actionCreator(workingListsCommonActionTypes.ROWS_PER_PAGE_CHANGE)({ rowsPerPage, storeId });

export const setTemplateSharingSettings = (sharingSettings, templateId, storeId) =>
    actionCreator(workingListsCommonActionTypes.TEMPLATE_SHARING_SETTINGS_SET)({
        sharingSettings,
        templateId,
        storeId,
    });
