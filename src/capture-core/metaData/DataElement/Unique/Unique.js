//
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-restricted-syntax */
import { scopes } from "./scopes.const";

export class Unique {
    constructor(initFn) {
        this._scope = scopes.ENTIRE_SYSTEM;
        this._generatable = false;
        initFn && initFn(this);
    }

    set generatable(generatable) {
        this._generatable = generatable;
    }
    get generatable() {
        return this._generatable;
    }

    set scope(scope) {
        this._scope = scope;
    }
    get scope() {
        return this._scope;
    }

    set onValidate(validator) {
        this._onValidate = validator;
    }
    get onValidate() {
        return this._onValidate;
    }
}
