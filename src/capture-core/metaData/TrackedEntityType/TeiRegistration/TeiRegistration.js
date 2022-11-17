//
/* eslint-disable no-underscore-dangle */
import isFunction from "d2-utilizr/lib/isFunction";

export class TeiRegistration {
    constructor(initFn) {
        initFn && isFunction(initFn) && initFn(this);
    }

    set form(formFoundation) {
        this._form = formFoundation;
    }
    get form() {
        return this._form;
    }

    set inputSearchGroups(searchGroups) {
        this._inputSearchGroups = searchGroups;
    }
    get inputSearchGroups() {
        return this._inputSearchGroups;
    }

    set trackedEntityType(type) {
        this._trackedEntityType = type;
    }
    get trackedEntityType() {
        return this._trackedEntityType;
    }
}
