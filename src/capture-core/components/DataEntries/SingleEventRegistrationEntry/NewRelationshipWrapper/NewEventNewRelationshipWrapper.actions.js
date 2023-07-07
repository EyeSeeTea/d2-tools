//
import { actionCreator } from "../../../../actions/actions.utils";

export const actionTypes = {
    NEW_EVENT_CANCEL_NEW_RELATIONSHIP: "NewEventCancelNewRelationship",
    ADD_NEW_EVENT_RELATIONSHIP: "AddNewEventRelationship",
    RECENTLY_ADDED_RELATIONSHIP: "RecentlyAddedRelationship",
};

export const batchActionTypes = {
    ADD_RELATIONSHIP_BATCH: "AddNewEventRelationshipBatch",
};

export const newEventCancelNewRelationship = dataEntryId =>
    actionCreator(actionTypes.NEW_EVENT_CANCEL_NEW_RELATIONSHIP)({ dataEntryId });

export const addNewEventRelationship = (relationshipType, entity, entityType) =>
    actionCreator(actionTypes.ADD_NEW_EVENT_RELATIONSHIP)({ relationshipType, entity, entityType });

export const recentlyAddedRelationship = relationshipId =>
    actionCreator(actionTypes.RECENTLY_ADDED_RELATIONSHIP)({ relationshipId });
