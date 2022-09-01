//
import React, { memo } from "react";
import { WorkingListsContextBuilder } from "./ContextBuilder";

export const WorkingListsBase = memo(props => <WorkingListsContextBuilder {...props} />);
