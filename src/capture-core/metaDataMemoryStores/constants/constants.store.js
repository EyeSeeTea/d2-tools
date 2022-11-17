//
/* eslint-disable no-underscore-dangle */

class ConstantStore {
    set(constants) {
        this._constants = constants;
    }

    get() {
        return this._constants;
    }
}

export const constantsStore = new ConstantStore();
