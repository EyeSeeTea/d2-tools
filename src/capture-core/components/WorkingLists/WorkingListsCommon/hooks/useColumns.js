//
import { useMemo } from "react";

export const useColumns = (
    customColumnOrder, // eslint-disable-line
    defaultColumns
) => {
    const defaultColumnsAsObject = useMemo(
        () => defaultColumns.reduce((acc, column) => ({ ...acc, [column.id]: column }), {}),
        [defaultColumns]
    );

    // $FlowFixMe Based on the business logic the customColumOrder id should exists as a key in defaultColumnsAsObject
    return useMemo(() => {
        if (!customColumnOrder) {
            return defaultColumns;
        }

        return customColumnOrder.map(({ id, visible }) => ({
            ...defaultColumnsAsObject[id],
            visible,
        }));
    }, [customColumnOrder, defaultColumns, defaultColumnsAsObject]);
};
