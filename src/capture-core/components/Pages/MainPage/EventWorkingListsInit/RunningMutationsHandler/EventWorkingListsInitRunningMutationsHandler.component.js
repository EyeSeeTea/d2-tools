//
import React from "react";
import { withLoadingIndicator } from "../../../../../HOC";
import { EventWorkingLists } from "../../../../WorkingLists/EventWorkingLists";

const EventWorkingListsWithLoadingIndicator = withLoadingIndicator()(EventWorkingLists);

export const EventWorkingListsInitRunningMutationsHandler = ({ mutationInProgress, ...passOnProps }) => (
    <EventWorkingListsWithLoadingIndicator {...passOnProps} ready={!mutationInProgress} />
);
