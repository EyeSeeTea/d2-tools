//
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-restricted-syntax */
import log from "loglevel";
import isFunction from "d2-utilizr/lib/isFunction";
import isArray from "d2-utilizr/lib/isArray";
import { errorCreator } from "capture-core-utils";

import { OptionSet } from "../OptionSet/OptionSet";

import { dataElementTypes } from "./dataElementTypes";

// eslint-disable-next-line no-use-before-define

export class DataElement {
    static errorMessages = {
        TYPE_NOT_FOUND: "type not supported",
    };

    constructor(initFn) {
        this._displayInReports = true;
        this._displayInForms = true;
        this.disabled = false;
        this.compulsory = false;
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

    set shortName(shortName) {
        this._shortName = shortName;
    }
    get shortName() {
        return this._shortName;
    }

    set formName(formName) {
        this._formName = formName;
    }
    get formName() {
        return this._formName;
    }

    set displayInForms(display) {
        this._displayInForms = display != null ? display : true;
    }

    set displayInReports(display) {
        this._displayInReports = display != null ? display : true;
    }
    get displayInReports() {
        return this._displayInReports;
    }

    set disabled(disabled) {
        this._disabled = !!disabled;
    }
    get disabled() {
        return this._disabled;
    }

    set compulsory(compulsory) {
        this._compulsory = !!compulsory;
    }
    get compulsory() {
        return this._compulsory;
    }

    set description(description) {
        this._description = description;
    }
    get description() {
        return this._description;
    }

    set type(type) {
        if (!dataElementTypes[type]) {
            log.warn(errorCreator(DataElement.errorMessages.TYPE_NOT_FOUND)({ dataElement: this, type }));
            this._type = dataElementTypes.UNKNOWN;
        } else {
            // $FlowFixMe dataElementTypes flow error
            this._type = type;
        }
    }
    get type() {
        return this._type;
    }

    set optionSet(optionSet) {
        this._optionSet = optionSet;
    }
    get optionSet() {
        return this._optionSet;
    }

    set icon(icon) {
        this._icon = icon;
    }
    get icon() {
        return this._icon;
    }

    set unique(unique) {
        this._unique = unique;
    }
    get unique() {
        return this._unique;
    }

    set searchable(searchable) {
        this._searchable = searchable;
    }

    get searchable() {
        return this._searchable;
    }

    set url(url) {
        this._url = url;
    }

    get url() {
        return this._url;
    }

    *getPropertyNames() {
        const excluded = [
            "getPropertyNames",
            "constructor",
            "copyPropertiesTo",
            "getConvertedOptionSet",
            "convertValue",
        ];
        for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
            if (!excluded.includes(name)) {
                yield name;
            }
        }
    }

    copyPropertiesTo(object) {
        for (const propName of this.getPropertyNames()) {
            // $FlowFixMe[prop-missing] automated comment
            object[propName] = this[propName];
        }
        return object;
    }

    getConvertedOptionSet(onConvert) {
        if (this.optionSet) {
            const currentOptions = this.optionSet.options.map(option => option.clone());
            // $FlowFixMe[incompatible-use] automated comment
            const convertedOptionSet = new OptionSet(
                this.optionSet.id,
                currentOptions,
                null,
                this,
                onConvert
            );
            // $FlowFixMe[incompatible-use] automated comment
            convertedOptionSet.inputType = this.optionSet.inputType;
            // $FlowFixMe[incompatible-use] automated comment
            convertedOptionSet.viewType = this.optionSet.viewType;
            // $FlowFixMe[incompatible-use] automated comment
            convertedOptionSet.emptyText = this.optionSet.emptyText;

            return convertedOptionSet;
        }
        return null;
    }

    convertValue(rawValue, onConvert) {
        return isArray(rawValue)
            ? rawValue.map(valuePart => onConvert(valuePart, this.type, this))
            : onConvert(rawValue, this.type, this);
    }
}
