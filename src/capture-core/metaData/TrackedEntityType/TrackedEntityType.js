//
import isFunction from "d2-utilizr/lib/isFunction";

/* eslint-disable no-underscore-dangle */
export class TrackedEntityType {
    constructor(initFn) {
        this._attributes = [];
        initFn && isFunction(initFn) && initFn(this);
    }

    set id(id) {
        this._id = id;
    }
    get id() {
        return this._id;
    }

    set access(access) {
        this._access = access;
    }
    get access() {
        return this._access;
    }

    set name(name) {
        this._name = name;
    }
    get name() {
        return this._name;
    }

    set teiRegistration(teiRegistration) {
        this._teiRegistration = teiRegistration;
    }
    get teiRegistration() {
        return this._teiRegistration;
    }

    set searchGroups(searchGroups) {
        this._searchGroups = searchGroups;
    }
    get searchGroups() {
        return this._searchGroups;
    }

    set attributes(attributes) {
        this._attributes = attributes;
    }
    get attributes() {
        return this._attributes;
    }
}
