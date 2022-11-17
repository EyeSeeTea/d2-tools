//
import { actionCreator } from "../../../actions/actions.utils";

export const actionTypes = {
    EVENT_DELETE: "EventWorkingListsEventListEventDelete",
    EVENT_DELETE_SUCCESS: "EventWorkingListsEventListEventDeleteSuccess",
    EVENT_DELETE_ERROR: "EventWorkingListsEventListEventDeleteError",
    VIEW_EVENT_PAGE_OPEN: "ViewEventPageOpen",
    EVENT_REQUEST_DELETE: "EventWorkingListsEventDelete",
};

export const deleteEventSuccess = (eventId, storeId) =>
    actionCreator(actionTypes.EVENT_DELETE_SUCCESS)({ eventId, storeId });

export const deleteEventError = () => actionCreator(actionTypes.EVENT_DELETE_ERROR)();

export const openViewEventPage = eventId => actionCreator(actionTypes.VIEW_EVENT_PAGE_OPEN)({ eventId });

export const requestDeleteEvent = (eventId, storeId) =>
    actionCreator(actionTypes.EVENT_REQUEST_DELETE)({ eventId, storeId });
