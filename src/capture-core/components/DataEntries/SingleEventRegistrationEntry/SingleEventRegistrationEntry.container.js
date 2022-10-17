//
import { connect, useDispatch } from "react-redux";
import * as React from "react";
import { useEffect } from "react";
import { compose } from "redux";
import { batchActions } from "redux-batched-actions";
import { SingleEventRegistrationEntryComponent } from "./SingleEventRegistrationEntry.component";
import { withBrowserBackWarning } from "../../../HOC/withBrowserBackWarning";
import { dataEntryHasChanges } from "../../DataEntry/common/dataEntryHasChanges";
import { makeEventAccessSelector } from "./SingleEventRegistrationEntry.selectors";
import { withLoadingIndicator } from "../../../HOC";
import { defaultDialogProps as dialogConfig } from "../../Dialogs/ConfirmDialog.constants";
import { getOpenDataEntryActions } from "./DataEntryWrapper/DataEntry";

const inEffect = state =>
    dataEntryHasChanges(state, "singleEvent-newEvent") || state.newEventPage.showAddRelationship;

const makeMapStateToProps = () => {
    const eventAccessSelector = makeEventAccessSelector();
    return (state, { id }) => ({
        ready: state.dataEntries[id],
        showAddRelationship: !!state.newEventPage.showAddRelationship,
        eventAccess: eventAccessSelector(state),
    });
};

const mapDispatchToProps = () => ({});

const mergeProps = stateProps => stateProps;

const openSingleEventDataEntry = InnerComponent => props => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(batchActions([...getOpenDataEntryActions()]));
    }, [dispatch]);

    return <InnerComponent {...props} />;
};

export const SingleEventRegistrationEntry = compose(
    openSingleEventDataEntry,
    connect(makeMapStateToProps, mapDispatchToProps, mergeProps),
    withLoadingIndicator(),
    withBrowserBackWarning(dialogConfig, inEffect)
)(SingleEventRegistrationEntryComponent);
