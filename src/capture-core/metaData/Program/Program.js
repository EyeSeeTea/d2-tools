//
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
import isFunction from "d2-utilizr/lib/isFunction";

export class Program {
    static errorMessages = {
        STAGE_NOT_FOUND: "Stage was not found",
        STAGE_INDEX_NOT_FOUND: "No stage found on index",
    };

    constructor(initFn) {
        this.programRules = [];
        this.programRuleVariables = [];
        this.organisationUnits = {};
        this._stages = new Map();
        this._organisationUnits = {};
        initFn && isFunction(initFn) && initFn(this);
    }

    // $FlowFixMe[unsupported-syntax] automated comment
    *[Symbol.iterator]() {
        for (const stage of this._stages.values()) {
            yield stage;
        }
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

    set shortName(shortName) {
        this._shortName = shortName;
    }
    get shortName() {
        return this._shortName;
    }

    set organisationUnits(organisationUnits) {
        this._organisationUnits = organisationUnits || {};
    }
    get organisationUnits() {
        return this._organisationUnits;
    }

    set categoryCombination(categoryCombination) {
        this._categoryCombination = categoryCombination;
    }
    get categoryCombination() {
        return this._categoryCombination;
    }

    set programRules(programRules) {
        this._programRules = programRules;
    }
    get programRules() {
        return this._programRules;
    }

    set programRuleVariables(programRuleVariables) {
        this._programRuleVariables = programRuleVariables;
    }
    get programRuleVariables() {
        return this._programRuleVariables;
    }

    set icon(icon) {
        this._icon = icon;
    }
    get icon() {
        return this._icon;
    }

    get stages() {
        return this._stages;
    }

    addStage(stage) {
        this.stages.set(stage.id, stage);
    }

    getStage(id) {
        return this.stages.get(id);
    }

    addProgramRuleVariables(programRuleVariables) {
        this.programRuleVariables = [...this.programRuleVariables, ...programRuleVariables];
    }

    addProgramRules(programRules) {
        this.programRules = [...this.programRules, ...programRules];
    }
}
