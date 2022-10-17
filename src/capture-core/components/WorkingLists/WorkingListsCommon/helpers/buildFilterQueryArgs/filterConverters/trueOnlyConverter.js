//

export function convertTrueOnly(filter) {
    // $FlowFixMe[incompatible-type] automated comment
    return `eq:${filter.value}`;
}
