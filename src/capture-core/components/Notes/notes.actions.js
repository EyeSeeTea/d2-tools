//
import { actionCreator } from "../../actions/actions.utils";

export const actionTypes = {
    SET_NOTES: "SetNotes",
    ADD_NOTE: "AddTTNote",
    REMOVE_NOTE: "RemoveNote",
};

export const setNotes = (key, notes) => actionCreator(actionTypes.SET_NOTES)({ key, notes });

export const addNote = (key, note) => actionCreator(actionTypes.ADD_NOTE)({ key, note });

export const removeNote = (key, noteClientId) =>
    actionCreator(actionTypes.REMOVE_NOTE)({ key, noteClientId });
