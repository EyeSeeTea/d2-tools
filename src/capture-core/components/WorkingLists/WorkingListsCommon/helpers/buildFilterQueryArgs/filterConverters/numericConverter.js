//

export function convertNumeric(filter) {
    const requestData = [];

    if (filter.ge || filter.ge === 0) {
        requestData.push(`ge:${filter.ge}`);
    }
    if (filter.le || filter.le === 0) {
        requestData.push(`le:${filter.le}`);
    }

    return requestData.join(":");
}
