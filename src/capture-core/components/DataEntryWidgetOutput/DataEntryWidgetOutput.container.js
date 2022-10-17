//
import { connect } from "react-redux";
import React from "react";
import { DataEntryWidgetOutputComponent } from "./DataEntryWidgetOutput.component";
import { getDataEntryKey } from "../DataEntry/common/getDataEntryKey";

const mapStateToProps = (state, { dataEntryId }) => {
    const { dataEntries } = state;
    const ready = !!dataEntries[dataEntryId];

    const dataEntryKey = ready ? getDataEntryKey(dataEntryId, state.dataEntries[dataEntryId].itemId) : null;
    return {
        ready,
        dataEntryKey,
    };
};

export const DataEntryWidgetOutput = connect(mapStateToProps, () => ({}))(props =>
    props.ready ? <DataEntryWidgetOutputComponent {...props} /> : null
);
