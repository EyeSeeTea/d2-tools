//
import React from "react";
import i18n from "@dhis2/d2-i18n";
import { InfoIconText } from "../../InfoIconText";

export const SavingText = ({ orgUnitName, stageName, programName }) => (
    <InfoIconText>
        <span>
            {i18n.t("Saving to {{stageName}} for {{programName}} in {{orgUnitName}}", {
                orgUnitName,
                stageName,
                programName,
                interpolation: { escapeValue: false },
            })}
        </span>
    </InfoIconText>
);
