//
/* eslint-disable no-underscore-dangle */
import isFunction from "d2-utilizr/lib/isFunction";
import { Program } from "./Program";

export class TrackerProgram extends Program {
    constructor(initFn) {
        super();
        this._attributes = [];
        initFn && isFunction(initFn) && initFn(this);
    }

    get searchGroups() {
        return this._searchGroups;
    }
    set searchGroups(searchGroups) {
        this._searchGroups = searchGroups;
    }

    get trackedEntityType() {
        return this._trackedEntityType;
    }
    set trackedEntityType(trackedEntityType) {
        this._trackedEntityType = trackedEntityType;
    }

    get enrollment() {
        return this._enrollment;
    }
    set enrollment(enrollment) {
        this._enrollment = enrollment;
    }

    get attributes() {
        return this._attributes;
    }
    set attributes(attributes) {
        this._attributes = attributes;
    }
}
