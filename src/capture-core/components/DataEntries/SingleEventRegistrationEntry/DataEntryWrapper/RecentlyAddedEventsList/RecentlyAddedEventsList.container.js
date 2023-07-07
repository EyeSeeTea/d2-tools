//
import { connect } from "react-redux";
import { NewEventsList } from "./RecentlyAddedEventsList.component";

const mapStateToProps = state => ({
    events: state.recentlyAddedEvents,
    eventsValues: state.recentlyAddedEventsValues,
});

const mapDispatchToProps = () => ({
    onRowClick: () => {},
});

// $FlowFixMe[missing-annot] automated comment
export const EventsList = connect(mapStateToProps, mapDispatchToProps)(NewEventsList);
