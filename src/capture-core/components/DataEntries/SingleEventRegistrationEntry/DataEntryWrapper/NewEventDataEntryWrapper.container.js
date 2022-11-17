//
import {} from "react";
import { connect } from "react-redux";
import { NewEventDataEntryWrapperComponent } from "./NewEventDataEntryWrapper.component";
import { setNewEventFormLayoutDirection } from "./newEventDataEntryWrapper.actions";
import { makeStageSelector } from "./newEventDataEntryWrapper.selectors";
import { getDataEntryHasChanges } from "../getNewEventDataEntryHasChanges";

const makeMapStateToProps = () => {
    const stageSelector = makeStageSelector();

    return state => {
        const stage = stageSelector(state);
        const formFoundation = stage && stage.stageForm ? stage.stageForm : null;
        return {
            stage,
            formFoundation,
            dataEntryHasChanges: getDataEntryHasChanges(state),
            formHorizontal:
                formFoundation && formFoundation.customForm ? false : !!state.newEventPage.formHorizontal,
        };
    };
};

const mapDispatchToProps = dispatch => ({
    onFormLayoutDirectionChange: formHorizontal => {
        dispatch(setNewEventFormLayoutDirection(formHorizontal));
    },
});

export const NewEventDataEntryWrapper = connect(
    makeMapStateToProps,
    mapDispatchToProps
)(NewEventDataEntryWrapperComponent);
