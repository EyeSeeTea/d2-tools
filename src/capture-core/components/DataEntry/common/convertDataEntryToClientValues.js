//
import { convertValue } from "../../../converters/formToClient";
import { convertDataEntryValuesToClientValues } from "./convertDataEntryValuesToClientValues";

export function convertDataEntryToClientValues(
    formFoundation,
    formValues,
    dataEntryValues,
    dataEntryValuesMeta
) {
    const formClientValues = formFoundation.convertValues(formValues, convertValue);
    const dataEntryClientValues = convertDataEntryValuesToClientValues(
        dataEntryValues,
        dataEntryValuesMeta,
        formFoundation
    );

    return {
        formClientValues,
        dataEntryClientValues,
    };
}
