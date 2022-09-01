//
import { createSelector } from "reselect";

const relationshipTypeIdSelector = state => state.newRelationship.selectedRelationshipTypeId;
const relationshipTypesSelector = (state, props) => props.relationshipTypes;

// $FlowFixMe[missing-annot] automated comment
export const makeSelectedRelationshipTypeSelector = () =>
    createSelector(
        relationshipTypeIdSelector,
        relationshipTypesSelector,
        (relationshipTypeId, relationshipTypes) => relationshipTypes.find(rt => rt.id === relationshipTypeId)
    );
