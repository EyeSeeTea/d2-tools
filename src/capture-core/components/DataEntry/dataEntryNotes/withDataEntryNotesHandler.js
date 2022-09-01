//
import * as React from "react";
import { connect } from "react-redux";
import { getDataEntryKey } from "../common/getDataEntryKey";

const getDataEntryNotesHandler = InnerComponent =>
    class DataEntryNotesHandlerHOC extends React.Component {
        handleAddNote = note => {
            this.props.onAddNote(this.props.itemId, this.props.dataEntryId, note);
        };

        render() {
            const { onAddNote, itemId, dataEntryId, ...passOnProps } = this.props;
            return <InnerComponent {...passOnProps} onAddNote={this.handleAddNote} />;
        }
    };

const mapStateToProps = (state, props) => {
    const itemId =
        state.dataEntries &&
        state.dataEntries[props.dataEntryId] &&
        state.dataEntries[props.dataEntryId].itemId;
    const key = getDataEntryKey(props.dataEntryId, itemId);
    return {
        itemId,
        notes: state.dataEntriesNotes[key] || [],
    };
};

export const withDataEntryNotesHandler = () => InnerComponent =>
    // $FlowFixMe[missing-annot] automated comment
    connect(mapStateToProps, () => ({}))(getDataEntryNotesHandler(InnerComponent));
