//
/* eslint-disable no-underscore-dangle */
import isFunction from "d2-utilizr/lib/isFunction";

export class RelationshipType {
    constructor(initFn) {
        initFn && isFunction(initFn) && initFn(this);
    }

    set id(id) {
        this._id = id;
    }

    get id() {
        return this._id;
    }

    set name(name) {
        this._name = name;
    }

    get name() {
        return this._name;
    }

    set access(access) {
        this._access = access;
    }

    get access() {
        return this._access;
    }

    set from(from) {
        this._from = from;
    }

    get from() {
        return this._from;
    }

    set to(to) {
        this._to = to;
    }

    get to() {
        return this._to;
    }
}
