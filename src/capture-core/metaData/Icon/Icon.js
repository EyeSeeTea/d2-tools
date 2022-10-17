//
/* eslint-disable no-underscore-dangle */
import isFunction from "d2-utilizr/lib/isFunction";

export class Icon {
    constructor(initFn) {
        this.color = "white";
        initFn && isFunction(initFn) && initFn(this);
    }

    set color(color) {
        this._color = color;
    }
    get color() {
        return this._color;
    }

    set name(name) {
        this._name = name;
    }
    get name() {
        return this._name;
    }

    clone() {
        return new Icon(cloneObject => {
            Object.getOwnPropertyNames(this).forEach(propName => {
                // $FlowFixMe
                cloneObject[propName] = this[propName];
            });
        });
    }
}
