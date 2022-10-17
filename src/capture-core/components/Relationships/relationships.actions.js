//
import { actionCreator } from "../../actions/actions.utils";

export const actionTypes = {
    SET_RELATIONSHIPS: "SetRelationships",
    ADD_RELATIONSHIP: "AddRelationship",
    UPDATE_RELATIONSHIP: "UpdateRelationship",
    REMOVE_RELATIONSHIP: "RemoveRelationship",
};

export const setRelationships = (key, relationships) =>
    actionCreator(actionTypes.SET_RELATIONSHIPS)({ key, relationships });

export const addRelationship = (key, relationship) =>
    actionCreator(actionTypes.ADD_RELATIONSHIP)({ key, relationship });

export const updateRelationship = (key, updatedRelationship) =>
    actionCreator(actionTypes.UPDATE_RELATIONSHIP)({ key, updatedRelationship });

export const removeRelationship = (key, relationshipClientId) =>
    actionCreator(actionTypes.REMOVE_RELATIONSHIP)({ key, relationshipClientId });
