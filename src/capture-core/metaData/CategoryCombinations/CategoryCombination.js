//
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
import isFunction from "d2-utilizr/lib/isFunction";

export class CategoryCombination {
    static errorMessages = {
        CATEGORY_NOT_FOUND: "Category was not found",
    };

    constructor(initFn) {
        this.name = "";
        this.id = "";
        this.categories = new Map();
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

    get categories() {
        return this._categories;
    }

    set categories(categories) {
        this._categories = categories;
    }
}
