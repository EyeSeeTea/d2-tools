//

import {
    getCurrentClientValues,
    getCurrentClientMainData,
    getApplicableRuleEffectsForEventProgram,
    updateRulesEffects,
} from "../../../../../../rules";

import { dataEntryId, itemId, formId } from "./constants";

export const getRulesActions = ({
    state, // temporary
    program,
    formFoundation,
    orgUnit,
}) => {
    const formValuesClient = getCurrentClientValues(state, formFoundation, formId);
    const dataEntryValuesClient = getCurrentClientMainData(state, itemId, dataEntryId, formFoundation);
    const currentEvent = { ...formValuesClient, ...dataEntryValuesClient, programStageId: formFoundation.id };

    const effects = getApplicableRuleEffectsForEventProgram({
        program,
        orgUnit,
        currentEvent,
    });

    return updateRulesEffects(effects, formId);
};
