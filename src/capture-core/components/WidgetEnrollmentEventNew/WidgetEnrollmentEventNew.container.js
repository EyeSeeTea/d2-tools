//
import React, { useMemo } from "react";
import i18n from "@dhis2/d2-i18n";
import { getProgramAndStageForProgram, TrackerProgram } from "../../metaData";
import { AccessVerification } from "./AccessVerification";

export const WidgetEnrollmentEventNew = ({ programId, stageId, onSave, ...passOnProps }) => {
    const { program, stage } = useMemo(
        () => getProgramAndStageForProgram(programId, stageId),
        [programId, stageId]
    );

    if (!program || !stage || !(program instanceof TrackerProgram)) {
        return <div>{i18n.t("program or stage is invalid")};</div>;
    }

    const formFoundation = stage.stageForm;

    return (
        <AccessVerification
            {...passOnProps}
            stage={stage}
            formFoundation={formFoundation}
            program={program}
            onSaveExternal={onSave}
        />
    );
};
