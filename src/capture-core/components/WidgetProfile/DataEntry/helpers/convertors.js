//

export const getProgramStageSectionId = valueApi => valueApi?.programStageSection?.id;

export const getProgramStageId = valueApi => valueApi?.programStage?.id;

export const getDataElementId = valueApi => valueApi?.dataElement?.id;

export const getTrackedEntityAttributeId = valueApi => valueApi?.trackedEntityAttribute?.id;

export const getOptionGroupId = valueApi => valueApi?.optionGroup?.id;

export const getOptionId = valueApi => valueApi?.option?.id;

export const getOptionSetId = valueApi => valueApi?.optionSet?.id;

export const getProgramId = valueApi => valueApi?.program?.id;

export const getTrackedEntityTypeId = valueApi => valueApi?.trackedEntityType?.id;

export const getProgramTrackedEntityAttributes = valueApi =>
    valueApi?.map(programAttribute => ({
        ...programAttribute,
        trackedEntityAttributeId: getTrackedEntityAttributeId(programAttribute),
    }));

export const getProgramRuleActions = valueApi =>
    valueApi?.map(apiProgramRuleAction => ({
        ...apiProgramRuleAction,
        programStageSectionId: getProgramStageSectionId(apiProgramRuleAction),
        programStageId: getProgramStageId(apiProgramRuleAction),
        dataElementId: getDataElementId(apiProgramRuleAction),
        trackedEntityAttributeId: getTrackedEntityAttributeId(apiProgramRuleAction),
        optionGroupId: getOptionGroupId(apiProgramRuleAction),
        optionId: getOptionId(apiProgramRuleAction),
    }));
