//
/* eslint-disable no-new-func */
import { convertValue } from "../../../converters/formToClient";

// $FlowSuppress
// $FlowFixMe[prop-missing] automated comment
const getFunctionFromString = functionAsString => Function(`return ${functionAsString}`)();

export function convertDataEntryValuesToClientValues(dataEntryValues, dataEntryValuesMeta, foundation) {
    if (!dataEntryValues) {
        return undefined;
    }
    const eventValues = Object.keys(dataEntryValues)
        // eslint-disable-next-line complexity
        .reduce((accEventValues, key) => {
            const type = dataEntryValuesMeta[key] && dataEntryValuesMeta[key].type;
            const onConvertOut = dataEntryValuesMeta[key] && dataEntryValuesMeta[key].onConvertOut;
            const clientIgnore = dataEntryValuesMeta[key] && dataEntryValuesMeta[key].clientIgnore;
            if (clientIgnore) {
                return accEventValues;
            }
            if (type) {
                const value = dataEntryValues[key];
                accEventValues[key] = convertValue(value, type);
            } else if (onConvertOut) {
                const clientId = dataEntryValuesMeta[key] && dataEntryValuesMeta[key].clientId;
                const dataEntryValue = dataEntryValues[key];
                const onConvertOutFn = getFunctionFromString(onConvertOut);
                accEventValues[clientId] = onConvertOutFn(dataEntryValue, foundation);
            } else {
                accEventValues[key] = dataEntryValues[key];
            }
            return accEventValues;
        }, {});

    return eventValues;
}
