//
/* eslint-disable no-underscore-dangle */
import {} from "react";
import { parseHtml } from "react-html-parser-ultimate";

/**
 * Stores html as react elements
 *
 * @export
 * @class CustomForm
 */
export class CustomForm {
    constructor(initFn) {
        this._id = "";
        initFn && initFn(this);
    }

    set id(id) {
        this._id = id;
    }
    get id() {
        return this._id;
    }
    /**
     * parses html to react elements
     *
     * @memberof CustomForm
     */
    setData(html, transformFunction) {
        this._data = parseHtml(html, {
            onTransform: transformFunction,
            allowScript: true,
        });
    }

    get data() {
        return this._data;
    }
}
