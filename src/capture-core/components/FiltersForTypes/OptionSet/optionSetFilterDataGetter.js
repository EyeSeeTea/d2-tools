//

function getSelectOptionSetFilterData(values) {
    return {
        usingOptionSet: true,
        values,
    };
}

export const getMultiSelectOptionSetFilterData = getSelectOptionSetFilterData;

export const getSingleSelectOptionSetFilterData = value => getSelectOptionSetFilterData([value]);
