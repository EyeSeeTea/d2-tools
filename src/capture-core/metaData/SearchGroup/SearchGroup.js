//
/* eslint-disable no-underscore-dangle */
import isFunction from "d2-utilizr/lib/isFunction";

export class SearchGroup {
    constructor(initFn) {
        this._minAttributesRequiredToSearch = 0;
        this._unique = false;
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

    set searchForm(searchForm) {
        this._searchForm = searchForm;
    }
    get searchForm() {
        return this._searchForm;
    }

    set unique(unique) {
        this._unique = unique;
    }
    get unique() {
        return this._unique;
    }
}
