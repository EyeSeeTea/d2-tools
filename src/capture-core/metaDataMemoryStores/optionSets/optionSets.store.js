//
/* eslint-disable no-underscore-dangle */

class OptionSetStore {
    constructor() {
        this._optionSets = {};
    }

    set(optionSets) {
        optionSets.forEach((value, key) => {
            this._optionSets[key] = value;
        });
    }

    get() {
        return this._optionSets;
    }
}

export const optionSetStore = new OptionSetStore();
