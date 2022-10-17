//
// todo this function is never used :)

import { convertValue } from "../clientToServer";

export function convertClientValuesToServer(clientValues, renderFoundation) {
    const convertedValues = renderFoundation.convertValues(clientValues, convertValue);
    return convertedValues;
}
