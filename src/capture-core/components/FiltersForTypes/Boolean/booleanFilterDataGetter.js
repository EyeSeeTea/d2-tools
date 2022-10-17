//

export function getBooleanFilterData(values) {
    return {
        values: values.map(value => value === "true"),
    };
}
