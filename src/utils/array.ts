export function cartesianProduct<T>(...groups: T[][]): T[][] {
    return groups.reduce<T[][]>(
        (results, entries) =>
            results
                .map(result => entries.map(entry => [...result, entry]))
                .reduce((subResults, result) => [...subResults, ...result], []),
        [[]]
    );
}
