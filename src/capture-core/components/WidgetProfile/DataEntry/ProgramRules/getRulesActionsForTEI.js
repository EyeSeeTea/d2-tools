//

import { rulesEngine } from "../../../../rules/rulesEngine";

import { updateRulesEffects, postProcessRulesEffects, buildEffectsHierarchy } from "../../../../rules";

const getEnrollmentForRulesExecution = enrollment =>
    enrollment && {
        // $FlowFixMe[prop-missing]
        enrollmentId: enrollment.enrollment,
        enrolledAt: enrollment.enrolledAt,
        occurredAt: enrollment.occurredAt,
    };

const getDataElementsForRulesExecution = dataElements =>
    dataElements &&
    Object.values(dataElements).reduce(
        (acc, dataElement) => ({
            ...acc,
            [dataElement.id]: {
                id: dataElement.id,
                valueType: dataElement.valueType,
                optionSetId: dataElement.optionSet && dataElement.optionSet.id,
            },
        }),
        {}
    );

const getRulesActions = (rulesEffects, foundation, formId) => {
    const effectsHierarchy = buildEffectsHierarchy(postProcessRulesEffects(rulesEffects, foundation));
    return [updateRulesEffects(effectsHierarchy, formId)];
};

export const getRulesActionsForTEI = ({
    foundation,
    formId,
    orgUnit,
    enrollmentData,
    teiValues,
    trackedEntityAttributes,
    optionSets,
    rulesContainer,
    otherEvents,
    dataElements,
    userRoles,
}) => {
    const effects = rulesEngine.getProgramRuleEffects({
        programRulesContainer: rulesContainer,
        currentEvent: null,
        otherEvents,
        dataElements: getDataElementsForRulesExecution(dataElements),
        trackedEntityAttributes,
        selectedEnrollment: getEnrollmentForRulesExecution(enrollmentData),
        selectedEntity: teiValues,
        selectedOrgUnit: orgUnit,
        selectedUserRoles: userRoles,
        optionSets,
    });
    return getRulesActions(effects, foundation, formId);
};
