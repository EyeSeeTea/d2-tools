//
import { connect } from "react-redux";
import { NewRelationshipComponent } from "./NewRelationship.component";

import {
    selectRelationshipType,
    deselectRelationshipType,
    selectFindMode,
    initializeNewRelationship,
} from "./newRelationship.actions";

const mapStateToProps = state => ({
    selectedRelationshipType: state.newRelationship.selectedRelationshipType,
    findMode: state.newRelationship.findMode,
});

const mapDispatchToProps = dispatch => ({
    onInitializeNewRelationship: () => {
        dispatch(initializeNewRelationship());
    },
    onSelectRelationshipType: selectedRelationshipType => {
        dispatch(selectRelationshipType(selectedRelationshipType));
    },
    onDeselectRelationshipType: () => {
        dispatch(deselectRelationshipType());
    },
    onSelectFindMode: findMode => {
        dispatch(selectFindMode(findMode));
    },
});

// $FlowFixMe[missing-annot] automated comment
export const NewRelationship = connect(mapStateToProps, mapDispatchToProps)(NewRelationshipComponent);
