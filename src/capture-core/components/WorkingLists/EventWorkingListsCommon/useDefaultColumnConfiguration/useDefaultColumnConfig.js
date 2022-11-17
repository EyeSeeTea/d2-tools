//
import { useMemo } from "react";
import { translatedStatusTypes } from "capture-core/events/statusTypes";
import i18n from "@dhis2/d2-i18n";
import { dataElementTypes as elementTypeKeys } from "../../../../metaData";
import { mainPropertyNames } from "../../../../events/mainPropertyNames.const";

const getDefaultMainConfig = stage => {
    const baseFields = [
        {
            id: mainPropertyNames.OCCURRED_AT,
            visible: true,
            // $FlowFixMe[prop-missing] automated comment
            type: elementTypeKeys.DATE,
            header: stage.stageForm.getLabel(mainPropertyNames.OCCURRED_AT),
        },
        {
            id: mainPropertyNames.EVENT_STATUS,
            visible: true,
            // $FlowFixMe[prop-missing] automated comment
            type: elementTypeKeys.TEXT,
            header: "Status",
            options: [
                { text: i18n.t("Active"), value: "ACTIVE" },
                { text: i18n.t("Completed"), value: "COMPLETED" },
            ],
            resolveValue: translatedStatusTypes,
        },
    ];

    const optionalFields = [];
    if (stage.enableUserAssignment) {
        optionalFields.push({
            id: mainPropertyNames.ASSIGNEE,
            visible: true,
            type: "ASSIGNEE",
            header: "Assigned to",
            apiName: "assignedUser",
        });
    }
    return [...baseFields, ...optionalFields].map(field => ({
        ...field,
        isMainProperty: true,
    }));
};

const getMetaDataConfig = stage =>
    stage.stageForm.getElements().map(({ id, displayInReports, type, formName, optionSet }) => ({
        id,
        visible: displayInReports,
        type,
        header: formName,
        options: optionSet && optionSet.options.map(({ text, value }) => ({ text, value })),
        multiValueFilter: !!optionSet,
    }));

export const useDefaultColumnConfig = stage =>
    useMemo(() => [...getDefaultMainConfig(stage), ...getMetaDataConfig(stage)], [stage]);
