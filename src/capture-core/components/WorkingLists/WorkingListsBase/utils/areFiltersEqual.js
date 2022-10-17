//

export function areFiltersEqual(prevFilters, newFilters) {
    if (prevFilters === newFilters) {
        return true;
    }

    const prevFilterKeys = Object.keys(prevFilters).filter(key => prevFilters[key] != null);
    const newFilterKeys = Object.keys(newFilters).filter(key => newFilters[key] != null);
    if (prevFilterKeys.length !== newFilterKeys.length) {
        return false;
    }

    return newFilterKeys.every(key => newFilters[key] === prevFilters[key]);
}
