//

function convertOptionSet(optionSet) {
    const options = optionSet.options.map(option => ({
        id: option.id,
        code: option.code,
        displayName: option.displayName,
    }));
    return {
        id: optionSet.id,
        displayName: optionSet.displayName,
        options,
    };
}

export function convertOptionSetsToRulesEngineFormat(cachedOptionSets) {
    const optionSets = {};
    Object.keys(cachedOptionSets).forEach(key => {
        optionSets[key] = convertOptionSet(cachedOptionSets[key]);
    });
    return optionSets;
}
