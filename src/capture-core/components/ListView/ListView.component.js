//
import React, { memo } from "react";
import { ListViewContextBuilder } from "./ContextBuilder";

export const ListView = memo(({ columns = [], ...passOnProps }) => (
    <ListViewContextBuilder {...passOnProps} columns={columns} />
));
