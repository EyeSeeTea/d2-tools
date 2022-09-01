//
/* eslint-disable no-underscore-dangle */
import isFunction from "d2-utilizr/lib/isFunction";

export class InputSearchGroup {
    constructor(initFn) {
        this._minAttributesRequiredToSearch = 0;
        initFn && isFunction(initFn) && initFn(this);
    }

    set id(id) {
        this._id = id;
    }
    get id() {
        return this._id;
    }

    set minAttributesRequiredToSearch(minAttributesRequiredToSearch) {
        this._minAttributesRequiredToSearch = minAttributesRequiredToSearch;
    }
    get minAttributesRequiredToSearch() {
        return this._minAttributesRequiredToSearch;
    }

    set searchFoundation(searchFoundation) {
        this._searchFoundation = searchFoundation;
    }
    get searchFoundation() {
        return this._searchFoundation;
    }

    set onSearch(searcher) {
        this._onSearch = searcher;
    }
    get onSearch() {
        return this._onSearch;
    }
}
