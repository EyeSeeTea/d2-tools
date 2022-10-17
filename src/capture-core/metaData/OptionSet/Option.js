//
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
import isFunction from "d2-utilizr/lib/isFunction";

export class Option {
    constructor(initFn) {
        initFn && isFunction(initFn) && initFn(this);
    }

    set id(id) {
        this._id = id;
    }

    get id() {
        return this._id;
    }

    set value(value) {
        this._value = value;
    }
    get value() {
        return this._value;
    }

    set text(text) {
        this._text = text;
    }
    get text() {
        return this._text;
    }

    set description(description) {
        this._description = description;
    }
    get description() {
        return this._description;
    }

    set icon(icon) {
        this._icon = icon;
    }
    get icon() {
        return this._icon;
    }

    clone() {
        return new Option(cloneObject => {
            Object.getOwnPropertyNames(this).forEach(propName => {
                // $FlowFixMe
                if (propName === "_icon" && this[propName]) {
                    // $FlowFixMe
                    cloneObject.icon = this.icon.clone();
                } else {
                    // $FlowFixMe
                    cloneObject[propName] = this[propName];
                }
            });
        });
    }
}
