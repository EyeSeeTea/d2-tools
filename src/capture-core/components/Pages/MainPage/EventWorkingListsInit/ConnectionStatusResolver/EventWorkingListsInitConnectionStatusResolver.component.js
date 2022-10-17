//
import React from "react";
import { EventWorkingListsInitHeader } from "../Header";
import { EventWorkingListsOffline } from "../../../../WorkingLists/EventWorkingListsOffline";
import { EventWorkingListsInitRunningMutationsHandler } from "../RunningMutationsHandler";

export const EventWorkingListsInitConnectionStatusResolver = ({ isOnline, storeId, ...passOnProps }) => (
    <EventWorkingListsInitHeader>
        {!isOnline ? (
            <EventWorkingListsOffline storeId={storeId} />
        ) : (
            <EventWorkingListsInitRunningMutationsHandler {...passOnProps} storeId={storeId} />
        )}
    </EventWorkingListsInitHeader>
);
