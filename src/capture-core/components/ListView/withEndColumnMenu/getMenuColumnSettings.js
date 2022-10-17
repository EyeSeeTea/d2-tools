//
import * as React from "react";
import { RowMenu } from "./RowMenu.component";

export const getMenuColumnSettings = () => ({
    getCellBody: (row, props) => <RowMenu row={row} {...props} />,
    headerCellStyle: { width: 96 },
});
