//

export const buildEffectsHierarchy = effects =>
    effects.reduce((accEffectsObject, effect) => {
        const { type, id } = effect;
        accEffectsObject[type] = accEffectsObject[type] || {};
        accEffectsObject[type][id] = accEffectsObject[type][id] || [];
        accEffectsObject[type][id].push(effect);
        return accEffectsObject;
    }, {});
