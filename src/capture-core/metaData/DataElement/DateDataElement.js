//
/* eslint-disable no-underscore-dangle */
import { DataElement } from "./DataElement";

export class DateDataElement extends DataElement {
    constructor(initFn) {
        super();
        this._allowFutureDate = true;
        initFn && initFn(this);
    }

    set allowFutureDate(allowFutureDate) {
        this._allowFutureDate = !!allowFutureDate;
    }

    get allowFutureDate() {
        return this._allowFutureDate;
    }
}
