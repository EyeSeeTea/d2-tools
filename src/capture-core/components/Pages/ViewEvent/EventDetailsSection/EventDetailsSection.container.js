//
import { connect } from "react-redux";

import { EventDetailsSection } from "./EventDetailsSection.component";
import { startShowEditEventDataEntry } from "./eventDetails.actions";

const mapStateToProps = state => ({
    showEditEvent:
        state.viewEventPage.eventDetailsSection && state.viewEventPage.eventDetailsSection.showEditEvent,
});

const mapDispatchToProps = dispatch => ({
    onOpenEditEvent: orgUnit => {
        dispatch(startShowEditEventDataEntry(orgUnit));
    },
});

// $FlowSuppress
// $FlowFixMe[missing-annot] automated comment
export const EventDetails = connect(mapStateToProps, mapDispatchToProps)(EventDetailsSection);
