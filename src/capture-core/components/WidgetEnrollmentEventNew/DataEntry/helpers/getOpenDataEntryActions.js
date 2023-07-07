//

import { convertGeometryOut } from "capture-core/components/DataEntries/converters";
import { loadNewDataEntry } from "../../../DataEntry/actions/dataEntryLoadNew.actions";
import { getEventDateValidatorContainers } from "../fieldValidators/eventDate.validatorContainersGetter";
import { getNoteValidatorContainers } from "../fieldValidators/note.validatorContainersGetter";

const dataEntryPropsToInclude = [
    {
        id: "eventDate",
        type: "DATE",
        validatorContainers: getEventDateValidatorContainers(),
    },
    {
        clientId: "geometry",
        dataEntryId: "geometry",
        onConvertOut: convertGeometryOut,
    },
    {
        id: "note",
        type: "TEXT",
        validatorContainers: getNoteValidatorContainers(),
        clientIgnore: true,
    },
    {
        id: "assignee",
    },
];

export const getOpenDataEntryActions = (dataEntryId, itemId) =>
    loadNewDataEntry(dataEntryId, itemId, dataEntryPropsToInclude);
