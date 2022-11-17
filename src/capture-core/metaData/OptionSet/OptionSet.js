//
/* eslint-disable no-underscore-dangle */
import log from "loglevel";
import isArray from "d2-utilizr/lib/isArray";
import { errorCreator } from "capture-core-utils";

import { viewTypes, inputTypes, inputTypesAsArray } from "./optionSet.const";

export class OptionSet {
    static errorMessages = {
        OPTION_NOT_FOUND: "Option not found",
        UNSUPPORTED_VIEWTYPE: "Tried to set an unsupported viewType",
        UNSUPPORTED_INPUTTYPE: "Tried to set an unsuported inputType",
    };

    constructor(id, options, optionGroups, dataElement, onConvert) {
        this._options = !options
            ? []
            : options.reduce((accOptions, currentOption) => {
                  if (currentOption.value || currentOption.value === false || currentOption.value === 0) {
                      currentOption.value =
                          onConvert && dataElement
                              ? onConvert(currentOption.value, dataElement.type, dataElement)
                              : currentOption.value;
                      accOptions.push(currentOption);
                  } else {
                      this._emptyText = currentOption.text;
                  }
                  return accOptions;
              }, []);

        this._optionGroups = optionGroups || new Map();

        this._id = id;
        this._dataElement = dataElement;
        this._inputType = inputTypes.DROPDOWN;
    }

    set id(id) {
        this._id = id;
    }
    get id() {
        return this._id;
    }

    set inputType(inputType) {
        if (!inputType) {
            return;
        }

        if (inputTypesAsArray.includes(inputType)) {
            this._inputType = inputType;
        } else {
            log.warn(
                errorCreator(OptionSet.errorMessages.UNSUPPORTED_INPUTTYPE)({ optionSet: this, inputType })
            );
        }
    }
    get inputType() {
        return this._inputType;
    }

    set viewType(viewType) {
        if (!viewType) {
            return;
        }

        if (viewTypes[viewType]) {
            this._viewType = viewType;
        } else {
            log.warn(
                errorCreator(OptionSet.errorMessages.UNSUPPORTED_VIEWTYPE)({ optionSet: this, viewType })
            );
        }
    }
    get viewType() {
        return this._viewType;
    }

    get emptyText() {
        return this._emptyText;
    }
    set emptyText(emptyText) {
        this._emptyText = emptyText;
    }

    get options() {
        return this._options;
    }

    get optionGroups() {
        return this._optionGroups;
    }

    set optionGroups(optionGroups) {
        this._optionGroups = optionGroups;
    }

    get dataElement() {
        return this._dataElement;
    }

    addOption(option) {
        if (option.value || option.value === false || option.value === 0) {
            this._options.push(option);
        } else {
            this._emptyText = option.text;
        }
    }

    getOptionThrowIfNotFound(value) {
        const option = this.options.find(o => o.value === value);
        if (!option) {
            throw new Error(
                errorCreator(OptionSet.errorMessages.OPTION_NOT_FOUND)({ OptionSet: this, value })
            );
        }
        return option;
    }

    getOption(value) {
        const option = this.options.find(o => o.value === value);
        if (!option) {
            log.warn(errorCreator(OptionSet.errorMessages.OPTION_NOT_FOUND)({ OptionSet: this, value }));
        }
        return option;
    }

    getOptionsThrowIfNotFound(values) {
        return values.map(value => {
            const option = this.options.find(o => o.value === value);
            if (!option) {
                throw new Error(
                    errorCreator(OptionSet.errorMessages.OPTION_NOT_FOUND)({ OptionSet: this, value })
                );
            }
            return option;
        });
    }

    getOptions(values) {
        return values.reduce((accOptions, value) => {
            const option = this.options.find(o => o.value === value);
            if (option) {
                accOptions.push(option);
            } else {
                log.warn(errorCreator(OptionSet.errorMessages.OPTION_NOT_FOUND)({ OptionSet: this, value }));
            }
            return accOptions;
        }, []);
    }

    getOptionText(value) {
        const option = this.getOption(value);
        return option && option.text;
    }

    getOptionsText(values) {
        const options = this.getOptions(values);
        return options.map(option => option.text);
    }

    getOptionsTextAsString(values) {
        const texts = this.getOptionsText(values);
        return texts.toString();
    }

    resolveTextsAsString(values) {
        if (isArray(values)) {
            // $FlowFixMe[incompatible-call] automated comment
            return this.getOptionsTextAsString(values);
        }

        // $FlowFixMe[incompatible-call] automated comment
        return this.getOptionText(values);
    }
}
