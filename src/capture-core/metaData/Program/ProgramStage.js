//
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */

import isFunction from "d2-utilizr/lib/isFunction";

export class ProgramStage {
    constructor(initFn) {
        this.programRules = [];
        initFn && isFunction(initFn) && initFn(this);
    }

    get stageForm() {
        return this._stageForm;
    }

    set stageForm(stageForm) {
        this._stageForm = stageForm;
    }

    get id() {
        return this._id;
    }

    set id(id) {
        this._id = id;
    }

    get name() {
        return this._name;
    }

    set name(name) {
        this._name = name;
    }

    get untranslatedName() {
        return this._untranslatedName;
    }

    set untranslatedName(untranslatedName) {
        this._untranslatedName = untranslatedName;
    }

    set icon(icon) {
        this._icon = icon;
    }
    get icon() {
        return this._icon;
    }

    get relationshipTypes() {
        return this._relationshipTypes;
    }

    get relationshipTypesWhereStageIsFrom() {
        return this._relationshipTypes
            ? this._relationshipTypes.filter(r => r.from.programStageId && r.from.programStageId === this.id)
            : [];
    }

    set relationshipTypes(relationshipTypes) {
        this._relationshipTypes = relationshipTypes;
    }

    get enableUserAssignment() {
        return this._enableUserAssignment;
    }

    set enableUserAssignment(enable) {
        this._enableUserAssignment = enable;
    }

    get autoGenerateEvent() {
        return this._autoGenerateEvent;
    }

    set autoGenerateEvent(autoGenerate) {
        this._autoGenerateEvent = autoGenerate;
    }

    get generatedByEnrollmentDate() {
        return this._generatedByEnrollmentDate;
    }

    set generatedByEnrollmentDate(generate) {
        this._generatedByEnrollmentDate = generate;
    }

    get openAfterEnrollment() {
        return this._openAfterEnrollment;
    }

    set openAfterEnrollment(open) {
        this._openAfterEnrollment = open;
    }

    get reportDateToUse() {
        return this._reportDateToUse;
    }

    set reportDateToUse(reportDate = "enrolledAt") {
        if (reportDate === "false") {
            this._reportDateToUse = "enrolledAt";
        } else {
            this._reportDateToUse = reportDate;
        }
    }

    get minDaysFromStart() {
        return this._minDaysFromStart;
    }

    set minDaysFromStart(minDays = 0) {
        this._minDaysFromStart = minDays;
    }

    set programRules(programRules) {
        this._programRules = programRules;
    }
    get programRules() {
        return this._programRules;
    }
}
