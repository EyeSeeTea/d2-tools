//
import { effectActions } from "capture-core-utils/rulesEngine";

const getAssignEffectsBasedOnHideField = hideEffects =>
    hideEffects.map(({ id }) => ({
        id,
        value: null,
        type: effectActions.ASSIGN_VALUE,
    }));

const deduplicateEffectArray = effectArray => {
    const dedupedEffectsAsMap = new Map(effectArray.map(effect => [effect.id, effect]));
    return [...dedupedEffectsAsMap.values()];
};

const postProcessAssignEffects = ({ assignValueEffects, hideFieldEffects }) =>
    // assignValueEffects has precedence over "blank a hidden field"-assignments.
    // This requirement is met by destructuring assignValueEffects *last*.
    deduplicateEffectArray([...getAssignEffectsBasedOnHideField(hideFieldEffects), ...assignValueEffects]);

const postProcessHideSectionEffects = (hideSectionEffects, foundation) =>
    hideSectionEffects.flatMap(({ id: sectionId }) => {
        const section = foundation.getSection(sectionId);
        if (!section) {
            return [];
        }

        return [...section.elements.values()].map(({ id }) => ({
            id,
            type: effectActions.HIDE_FIELD,
        }));
    });

const filterHideEffects = (hideEffects, makeCompulsoryEffects, foundation) => {
    const compulsoryElements = foundation
        .getElements()
        .filter(({ compulsory }) => compulsory)
        .reduce((acc, { id }) => {
            acc[id] = true;
            return acc;
        }, {});

    const nonCompulsoryHideEffects = hideEffects.filter(
        ({ id }) => !(compulsoryElements[id] || makeCompulsoryEffects[id])
    );

    return deduplicateEffectArray(nonCompulsoryHideEffects);
};

export function postProcessRulesEffects(rulesEffects = [], foundation) {
    const elementsById = foundation.getElementsById();
    const scopeFilteredRulesEffects = rulesEffects.filter(
        ({ targetDataType, id }) => !targetDataType || elementsById[id]
    );

    const {
        [effectActions.HIDE_FIELD]: hideFieldEffects,
        [effectActions.HIDE_SECTION]: hideSectionEffects,
        [effectActions.ASSIGN_VALUE]: assignValueEffects,
        rest,
    } = scopeFilteredRulesEffects.reduce(
        (acc, effect) => {
            const { type } = effect;
            if (
                [effectActions.HIDE_FIELD, effectActions.HIDE_SECTION, effectActions.ASSIGN_VALUE].includes(
                    type
                )
            ) {
                // $FlowFixMe
                acc[type].push(effect);
            } else {
                acc.rest.push(effect);
            }
            return acc;
        },
        {
            [effectActions.HIDE_FIELD]: [],
            [effectActions.HIDE_SECTION]: [],
            [effectActions.ASSIGN_VALUE]: [],
            rest: [],
        }
    );

    const compulsoryEffectsObject = scopeFilteredRulesEffects.reduce((acc, effect) => {
        if (effect.type === effectActions.MAKE_COMPULSORY) {
            acc[effect.id] = effect;
        }
        return acc;
    }, {});

    const hideSectionFieldEffects = postProcessHideSectionEffects(hideSectionEffects, foundation);

    const filteredHideFieldEffects = filterHideEffects(
        [...hideFieldEffects, ...hideSectionFieldEffects],
        compulsoryEffectsObject,
        foundation
    );

    const filteredAssignValueEffects = postProcessAssignEffects({
        // $FlowFixMe
        assignValueEffects,
        hideFieldEffects: filteredHideFieldEffects,
    });

    return [...rest, ...filteredHideFieldEffects, ...filteredAssignValueEffects];
}
