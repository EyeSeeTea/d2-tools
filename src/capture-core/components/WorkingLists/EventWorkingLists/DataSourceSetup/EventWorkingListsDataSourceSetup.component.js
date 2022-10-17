//
import React from "react";
import { useDataSource } from "../../WorkingListsCommon";
import { EventWorkingListsTemplateSetup } from "../TemplateSetup";

export const EventWorkingListsDataSourceSetup = ({ records, columns, recordsOrder, ...passOnProps }) => (
    <EventWorkingListsTemplateSetup
        {...passOnProps}
        dataSource={useDataSource(records, recordsOrder, columns)}
        columns={columns}
        rowIdKey="id"
    />
);
