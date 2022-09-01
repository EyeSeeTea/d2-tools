//
/* eslint-disable no-underscore-dangle */
import isFunction from "d2-utilizr/lib/isFunction";

export class Category {
    static errorMessages = {
        CATEGORY_OPTION_NOT_FOUND: "Category option was not found",
    };

    constructor(initFn) {
        this.name = "";
        this.id = "";
        initFn && isFunction(initFn) && initFn(this);
    }

    get name() {
        return this._name;
    }

    set name(name) {
        this._name = name;
    }

    get id() {
        return this._id;
    }

    set id(id) {
        this._id = id;
    }
}
