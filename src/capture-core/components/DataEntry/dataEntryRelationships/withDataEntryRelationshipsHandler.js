//
import * as React from "react";
import { connect } from "react-redux";
import { getDataEntryKey } from "../common/getDataEntryKey";
import { removeRelationship } from "../actions/dataEntry.actions";

const getDataEntryRelationshipsHandler = InnerComponent =>
    class DataEntryRelationshipsHandlerHOC extends React.Component {
        handleOpenAddRelationship = () => {
            this.props.onOpenAddRelationship(this.props.itemId, this.props.dataEntryId);
        };
        handleRemoveRelationship = relClientId => {
            this.props.onRemoveRelationship(this.props.itemId, this.props.dataEntryId, relClientId);
        };

        render() {
            const { onOpenAddRelationship, onRemoveRelationship, itemId, dataEntryId, ...passOnProps } =
                this.props;
            return (
                <InnerComponent
                    {...passOnProps}
                    onOpenAddRelationship={this.handleOpenAddRelationship}
                    onRemoveRelationship={this.handleRemoveRelationship}
                />
            );
        }
    };

const mapStateToProps = (state, props) => {
    const itemId =
        state.dataEntries &&
        state.dataEntries[props.dataEntryId] &&
        state.dataEntries[props.dataEntryId].itemId;
    const dataEntryKey = getDataEntryKey(props.dataEntryId, itemId);
    return {
        relationships: state.dataEntriesRelationships[dataEntryKey],
        itemId,
    };
};

const mapDispatchToProps = dispatch => ({
    onRemoveRelationship: (itemId, dataEntryId, relationshipClientId) => {
        dispatch(removeRelationship(dataEntryId, itemId, relationshipClientId));
    },
});

export const withDataEntryRelationshipsHandler = () => InnerComponent =>
    // $FlowFixMe[missing-annot] automated comment
    connect(mapStateToProps, mapDispatchToProps)(getDataEntryRelationshipsHandler(InnerComponent));
