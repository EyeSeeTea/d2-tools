//
/* eslint-disable no-underscore-dangle */
import log from "loglevel";
import { errorCreator } from "capture-core-utils";
import isFunction from "d2-utilizr/lib/isFunction";
import { validationStrategies, validationStrategiesAsArray } from "./renderFoundation.const";

import { convertDataElementsValues } from "../helpers";

export class RenderFoundation {
    static errorMessages = {
        UNSUPPORTED_VALIDATION_STRATEGY: "Tried to set an unsupported validation strategy",
    };

    constructor(initFn) {
        this._sections = new Map();
        this._labels = {};
        this._validationStrategy = validationStrategies.ON_UPDATE_AND_INSERT;
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

    set description(description) {
        this._description = description;
    }
    get description() {
        return this._description;
    }

    set programId(programId) {
        this._programId = programId;
    }
    get programId() {
        return this._programId;
    }

    get sections() {
        return this._sections;
    }

    set featureType(featureType) {
        this._featureType = featureType;
    }
    get featureType() {
        return this._featureType;
    }

    set validationStrategy(strategy) {
        if (!strategy) {
            return;
        }

        if (!validationStrategiesAsArray.includes(strategy)) {
            log.warn(
                errorCreator(RenderFoundation.errorMessages.UNSUPPORTED_VALIDATION_STRATEGY)({
                    renderFoundation: this,
                    strategy,
                })
            );
            return;
        }

        this._validationStrategy = strategy;
    }
    get validationStrategy() {
        return this._validationStrategy;
    }

    addLabel({ id, label }) {
        this._labels[id] = label;
    }

    getLabel(id) {
        return this._labels[id];
    }

    addSection(newSection) {
        this._sections.set(newSection.id, newSection);
    }

    getSection(id) {
        return this._sections.get(id);
    }

    getElement(id) {
        const elements = this.getElementsById();
        return elements[id];
    }

    getElements() {
        return Array.from(this.sections.entries())
            .map(entry => entry[1])
            .reduce((accElements, section) => {
                const elementsInSection = Array.from(section.elements.entries()).map(entry => entry[1]);
                return [...accElements, ...elementsInSection];
            }, []);
    }

    getElementsById() {
        return Array.from(this.sections.entries())
            .map(entry => entry[1])
            .reduce((accElements, section) => {
                const elementsInSection = Array.from(section.elements.entries()).reduce(
                    (accElementsInSection, elementEntry) => {
                        accElementsInSection[elementEntry[0]] = elementEntry[1];
                        return accElementsInSection;
                    },
                    {}
                );
                return { ...accElements, ...elementsInSection };
            }, {});
    }

    convertValues(values, onConvert) {
        const dataElements = this.getElements();
        return convertDataElementsValues(values, dataElements, onConvert);
    }
}
