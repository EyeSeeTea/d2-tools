//
import React from "react";
import { NewEventDataEntryWrapper } from "./DataEntryWrapper/NewEventDataEntryWrapper.container";
import { NewRelationshipWrapper } from "./NewRelationshipWrapper/NewEventNewRelationshipWrapper.container";
import { SelectionsNoAccess } from "./SelectionsNoAccess/dataEntrySelectionsNoAccess.container";

export const SingleEventRegistrationEntryComponent = ({ showAddRelationship, eventAccess }) => {
    if (!eventAccess.write) {
        return <SelectionsNoAccess />;
    }

    return <>{showAddRelationship ? <NewRelationshipWrapper /> : <NewEventDataEntryWrapper />}</>;
};
