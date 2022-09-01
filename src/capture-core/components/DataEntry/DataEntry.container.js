//
import { connect } from "react-redux";
import { compose } from "redux";
import { DataEntryComponent } from "./DataEntry.component";
import { updateFormField } from "./actions/dataEntry.actions";
import { withLoadingIndicator } from "../../HOC";

const mapStateToProps = (state, props) => ({
    itemId: state.dataEntries[props.id] && state.dataEntries[props.id].itemId,
    ready: !!state.dataEntries[props.id],
});

const mapDispatchToProps = dispatch => ({
    onUpdateFieldInner: (
        dataEntryId,
        itemId,
        onUpdateField,
        value,
        uiState,
        elementId,
        formBuilderId,
        formId,
        updateCompleteUid
    ) => {
        const updateAction = updateFormField(
            value,
            uiState,
            elementId,
            formBuilderId,
            formId,
            dataEntryId,
            itemId,
            updateCompleteUid
        );

        if (onUpdateField) {
            onUpdateField(updateAction);
        } else {
            dispatch(updateAction);
        }
    },
});

export const DataEntry = compose(
    // $FlowFixMe
    connect(mapStateToProps, mapDispatchToProps, null),
    withLoadingIndicator(() => ({ height: "350px" }))
)(DataEntryComponent);
