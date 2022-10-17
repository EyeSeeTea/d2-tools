//
/* eslint-disable no-underscore-dangle */
import isFunction from "d2-utilizr/lib/isFunction";

import { labelKeys, defaultLabelValues } from "./labels.const";

export class Enrollment {
    constructor(initFn) {
        this._labels = {
            [labelKeys.OCCURRED_AT]: defaultLabelValues.OCCURRED_AT,
            [labelKeys.ENROLLED_AT]: defaultLabelValues.ENROLLED_AT,
        };

        this._optionFlags = {
            allowFutureEnrollmentDate: false,
            allowFutureIncidentDate: false,
            showIncidentDate: true,
        };

        initFn && isFunction(initFn) && initFn(this);
    }

    set enrollmentForm(formFoundation) {
        this._enrollmentForm = formFoundation;
    }
    get enrollmentForm() {
        return this._enrollmentForm;
    }

    set incidentDateLabel(label) {
        this._labels[labelKeys.OCCURRED_AT] = label;
    }
    get incidentDateLabel() {
        return this._labels[labelKeys.OCCURRED_AT];
    }

    set enrollmentDateLabel(label) {
        this._labels[labelKeys.ENROLLED_AT] = label;
    }
    get enrollmentDateLabel() {
        return this._labels[labelKeys.ENROLLED_AT];
    }

    set allowFutureEnrollmentDate(isAllowed) {
        this._optionFlags.allowFutureEnrollmentDate = isAllowed;
    }
    get allowFutureEnrollmentDate() {
        return this._optionFlags.allowFutureEnrollmentDate;
    }

    set allowFutureIncidentDate(isAllowed) {
        this._optionFlags.allowFutureIncidentDate = isAllowed;
    }
    get allowFutureIncidentDate() {
        return this._optionFlags.allowFutureIncidentDate;
    }

    set showIncidentDate(show) {
        this._optionFlags.showIncidentDate = show;
    }
    get showIncidentDate() {
        return this._optionFlags.showIncidentDate;
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
