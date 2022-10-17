//
/* eslint-disable no-underscore-dangle */
import isFunction from "d2-utilizr/lib/isFunction";

export class Event {
    constructor(initFn) {
        initFn && isFunction(initFn) && initFn(this);
    }

    set id(id) {
        this._id = id;
    }
    get id() {
        return this._id;
    }

    set programStageId(programStageId) {
        this._programStageId = programStageId;
    }
    get programStageId() {
        return this._programStageId;
    }

    set orgUnitId(orgUnitId) {
        this._orgUnitId = orgUnitId;
    }
    get orgUnitId() {
        return this._orgUnitId;
    }

    set orgUnitName(name) {
        this._orgUnitName = name;
    }
    get orgUnitName() {
        return this._orgUnitName;
    }

    set trackedEntityInstanceId(trackedEntityInstanceId) {
        this._trackedEntityInstanceId = trackedEntityInstanceId;
    }
    get trackedEntityInstanceId() {
        return this._trackedEntityInstanceId;
    }

    set enrollmentId(enrollmentId) {
        this._enrollmentId = enrollmentId;
    }
    get enrollmentId() {
        return this._enrollmentId;
    }

    set enrollmentStatus(enrollmentStatus) {
        this._enrollmentStatus = enrollmentStatus;
    }
    get enrollmentStatus() {
        return this._enrollmentStatus;
    }

    set status(status) {
        this._status = status;
    }
    get status() {
        return this._status;
    }

    set occurredAt(occurredAt) {
        this._occurredAt = occurredAt;
    }
    get occurredAt() {
        return this._occurredAt;
    }
}
