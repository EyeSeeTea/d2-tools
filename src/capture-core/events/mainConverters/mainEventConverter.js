//
export function convertMainEvent(event, keyMap = {}, onConvert) {
    return Object.keys(event).reduce((accConvertedEvent, key) => {
        const convertedValue = onConvert(key, event[key]);
        const outputKey = keyMap[key] || key;
        accConvertedEvent[outputKey] = convertedValue;
        return accConvertedEvent;
    }, {});
}
