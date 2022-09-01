//
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
import isFunction from "d2-utilizr/lib/isFunction";

export class OptionGroup {
    constructor(initFn) {
        initFn && isFunction(initFn) && initFn(this);
    }

    set id(id) {
        this._id = id;
    }

    get id() {
        return this._id;
    }

    set optionIds(optionIds) {
        this._optionIds = optionIds;
    }
    get optionIds() {
        return this._optionIds;
    }
}
