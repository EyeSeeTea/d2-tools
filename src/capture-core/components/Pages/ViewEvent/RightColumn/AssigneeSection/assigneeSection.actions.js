//

import { actionCreator } from "../../../../../actions/actions.utils";
import { effectMethods } from "../../../../../trackerOffline";

export const actionTypes = {
    VIEW_EVENT_ASSIGNEE_SET: "ViewEventAssigneeSet",
    VIEW_EVENT_ASSIGNEE_SAVE: "ViewEventAssigneeSave",
    VIEW_EVENT_ASSIGNEE_SAVE_COMPLETED: "ViewEventAssigneeSaveCompleted",
    VIEW_EVENT_ASSIGNEE_SAVE_FAILED: "ViewEventAssigneeSaveFailed",
};

export const setAssignee = assignee => actionCreator(actionTypes.VIEW_EVENT_ASSIGNEE_SET)({ assignee });

export const saveAssignee = (eventId, serverData, selections) =>
    actionCreator(actionTypes.VIEW_EVENT_ASSIGNEE_SAVE)(
        {},
        {
            offline: {
                effect: {
                    url: "tracker?async=false&importStrategy=UPDATE",
                    method: effectMethods.POST,
                    data: serverData,
                },
                commit: {
                    type: actionTypes.VIEW_EVENT_ASSIGNEE_SAVE_COMPLETED,
                    meta: { eventId, selections },
                },
                rollback: {
                    type: actionTypes.VIEW_EVENT_ASSIGNEE_SAVE_FAILED,
                    meta: { eventId, selections },
                },
            },
        }
    );
