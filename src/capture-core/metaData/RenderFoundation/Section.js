//
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-restricted-syntax */
import isFunction from "d2-utilizr/lib/isFunction";
import isDefined from "d2-utilizr/lib/isDefined";

export class Section {
    static MAIN_SECTION_ID = "#MAIN#";

    static errorMessages = {
        DATA_ELEMENT_NOT_FOUND: "Data element was not found",
    };

    constructor(initFn) {
        this._visible = true;
        this._open = true;
        this._collapsible = false;
        this._elements = new Map();
        this._showContainer = true;
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

    set displayDescription(description) {
        this._displayDescription = description;
    }
    get displayDescription() {
        return this._displayDescription;
    }

    set open(open) {
        // $FlowFixMe[incompatible-type] automated comment
        this._open = isDefined(open) ? open : true;
    }
    get open() {
        return this._open;
    }

    set visible(visible) {
        // $FlowFixMe[incompatible-type] automated comment
        this._visible = isDefined(visible) ? visible : true;
    }
    get visible() {
        return this._visible;
    }

    set customForm(customForm) {
        this._customForm = customForm;
    }
    get customForm() {
        return this._customForm;
    }

    set showContainer(showContainer) {
        // $FlowFixMe[incompatible-type] automated comment
        this._showContainer = isDefined(showContainer) ? showContainer : true;
    }
    get showContainer() {
        return this._showContainer;
    }

    get elements() {
        return this._elements;
    }

    addElement(element) {
        if (!this.elements.has(element.id)) {
            this.elements.set(element.id, element);
        }
    }

    *getPropertyNames() {
        const excluded = ["getPropertyNames", "constructor", "copyPropertiesTo"];

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
}
