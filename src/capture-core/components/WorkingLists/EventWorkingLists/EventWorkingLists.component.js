//
import React, { useEffect } from "react";
import log from "loglevel";
import i18n from "@dhis2/d2-i18n";
import { errorCreator } from "capture-core-utils";
import { EventWorkingListsReduxProvider } from "./ReduxProvider";
import { useProgramStageInfo } from "../../../metaDataMemoryStores/programCollection/helpers";

export const EventWorkingLists = ({ storeId, programId, programStageId, orgUnitId }) => {
    const { program, programStage, error } = useProgramStageInfo(programStageId, programId);

    useEffect(() => {
        if (error) {
            log.error(errorCreator(error)({ programId, programStageId }));
        }
    }, [error, programId, programStageId]);

    if (error) {
        return i18n.t("Working list could not be loaded");
    }

    return (
        <div data-test="event-working-lists">
            <EventWorkingListsReduxProvider
                storeId={storeId}
                // $FlowFixMe
                program={program}
                // $FlowFixMe
                programStage={programStage}
                orgUnitId={orgUnitId}
            />
        </div>
    );
};
