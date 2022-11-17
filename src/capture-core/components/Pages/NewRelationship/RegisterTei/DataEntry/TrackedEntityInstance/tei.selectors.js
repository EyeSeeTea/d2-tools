//
import log from "loglevel";
import { errorCreator } from "capture-core-utils";
import { createSelector } from "reselect";

import { getTrackedEntityTypeThrowIfNotFound } from "../../../../../../metaData";

const trackedEntityTypeIdSelector = state =>
    state.newRelationship.selectedRelationshipType.to.trackedEntityTypeId;

// $FlowFixMe
export const makeTeiRegistrationMetadataSelector = () =>
    createSelector(trackedEntityTypeIdSelector, TETypeId => {
        let TEType;
        try {
            TEType = getTrackedEntityTypeThrowIfNotFound(TETypeId);
        } catch (error) {
            log.error(errorCreator("Could not get TrackedEntityType for id")({ TETypeId }));
            return null;
        }

        return TEType.teiRegistration;
    });
