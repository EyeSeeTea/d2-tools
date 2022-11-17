//

import { actionCreator } from "../../actions/actions.utils";

export const actionTypes = {
    START_SHOW_EDIT_EVENT_DATA_ENTRY: "WidgetEventEdit.StartShowEditEventDataEntry",
};

export const startShowEditEventDataEntry = orgUnit =>
    actionCreator(actionTypes.START_SHOW_EDIT_EVENT_DATA_ENTRY)({ orgUnit });
