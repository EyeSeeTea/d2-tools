//
import React from "react";

import { EnrollmentRegistrationEntryComponent } from "./EnrollmentRegistrationEntry.component";

import { useLifecycle } from "./hooks";
import { useCurrentOrgUnitInfo } from "../../../hooks/useCurrentOrgUnitInfo";
import { useRulesEngineOrgUnit } from "../../../hooks/useRulesEngineOrgUnit";

export const EnrollmentRegistrationEntry = ({
    selectedScopeId,
    id,
    trackedEntityInstanceAttributes,
    ...passOnProps
}) => {
    const orgUnitId = useCurrentOrgUnitInfo().id;
    const { orgUnit, error } = useRulesEngineOrgUnit(orgUnitId);
    const { teiId, ready, skipDuplicateCheck } = useLifecycle(
        selectedScopeId,
        id,
        trackedEntityInstanceAttributes,
        orgUnit
    );

    if (error) {
        return error.errorComponent;
    }

    return (
        <EnrollmentRegistrationEntryComponent
            {...passOnProps}
            selectedScopeId={selectedScopeId}
            id={id}
            ready={ready}
            teiId={teiId}
            skipDuplicateCheck={skipDuplicateCheck}
            orgUnitId={orgUnitId}
            orgUnit={orgUnit}
        />
    );
};
