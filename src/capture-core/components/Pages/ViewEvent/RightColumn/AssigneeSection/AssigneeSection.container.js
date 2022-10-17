//
import { connect } from "react-redux";
import { AssigneeSectionComponent } from "./AssigneeSection.component";
import { setAssignee } from "./assigneeSection.actions";

const mapStateToProps = state => {
    const assigneeSection = state.viewEventPage.assigneeSection || {};

    return {
        assignee: !assigneeSection.isLoading
            ? state.viewEventPage.loadedValues.eventContainer.event.assignee
            : undefined,
        ready: !assigneeSection.isLoading,
    };
};

const mapDispatchToProps = dispatch => ({
    onSet: user => {
        dispatch(setAssignee(user));
    },
});

// $FlowSuppress
// $FlowFixMe[missing-annot] automated comment
export const AssigneeSection = connect(mapStateToProps, mapDispatchToProps)(AssigneeSectionComponent);
