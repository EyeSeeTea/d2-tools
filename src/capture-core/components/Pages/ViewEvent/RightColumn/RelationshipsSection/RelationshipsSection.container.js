//
import { connect } from "react-redux";
import { RelationshipsSectionComponent } from "./RelationshipsSection.component";
import { openAddRelationship } from "../../ViewEventComponent/viewEvent.actions";
import { requestDeleteEventRelationship } from "../../Relationship/ViewEventRelationships.actions";

const mapStateToProps = state => {
    const relationshipsSection = state.viewEventPage.relationshipsSection || {};
    return {
        eventId: state.viewEventPage.eventId,
        ready: !relationshipsSection.isLoading,
        relationships: state.relationships.viewEvent || [],
        orgUnitId: state.currentSelections.orgUnitId,
    };
};

const mapDispatchToProps = dispatch => ({
    onOpenAddRelationship: () => {
        dispatch(openAddRelationship());
    },
    onDeleteRelationship: clientId => {
        dispatch(requestDeleteEventRelationship(clientId));
    },
});

// $FlowSuppress
// $FlowFixMe[missing-annot] automated comment
export const RelationshipsSection = connect(
    mapStateToProps,
    mapDispatchToProps
)(RelationshipsSectionComponent);
