//
/* eslint-disable */
// $FlowFixMe
Object.defineProperty(Array.prototype, "toHashMap", {
    enumerable: false,
    value: function (key) {
        return this.reduce((accObjects, item) => {
            accObjects[item[key]] = item;
            return accObjects;
        }, {});
    },
});
