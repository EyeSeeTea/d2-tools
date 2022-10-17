//
import { actionCreator } from "../../../actions/actions.utils";
import { addFormData } from "../../D2Form/actions/form.actions";
import { getDataEntryKey } from "../common/getDataEntryKey";
import {
    getDataEntryMeta,
    getDataEntryValues,
    getFormValues,
    validateDataEntryValues,
    getDataEntryNotes,
} from "./dataEntryLoad.utils";

export const actionTypes = {
    LOAD_EDIT_DATA_ENTRY: "LoadEditDataEntry",
};

export function loadEditDataEntry(
    dataEntryId,
    itemId,
    clientValuesForDataEntry,
    clientValuesForForm,
    dataEntryPropsToInclude,
    formFoundation,
    extraProps
) {
    const dataEntryMeta = dataEntryPropsToInclude ? getDataEntryMeta(dataEntryPropsToInclude) : {};
    const dataEntryValues = dataEntryPropsToInclude
        ? getDataEntryValues(dataEntryPropsToInclude, clientValuesForDataEntry)
        : {};

    const dataEntryNotes = getDataEntryNotes(clientValuesForDataEntry);
    const dataEntryUI = dataEntryPropsToInclude
        ? validateDataEntryValues(dataEntryValues, dataEntryPropsToInclude)
        : {};
    const formValues = getFormValues(clientValuesForForm, formFoundation);
    const key = getDataEntryKey(dataEntryId, itemId);
    return [
        actionCreator(actionTypes.LOAD_EDIT_DATA_ENTRY)({
            key,
            itemId,
            dataEntryId,
            dataEntryMeta,
            dataEntryValues,
            dataEntryNotes,
            extraProps,
            dataEntryUI,
        }),
        addFormData(key, formValues),
    ];
}
