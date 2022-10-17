//
import { convertServerToClient } from "../../../converters";
import {} from "../../../metaData";

export const getAttributeValuesForRulesEngine = (attributeValues = [], attributes) =>
    attributeValues.reduce((acc, { id, value }) => {
        const dataElement = attributes.find(({ id: attributeId }) => id === attributeId);
        if (dataElement) {
            acc[id] = convertServerToClient(value, dataElement.type);
        }
        return acc;
    }, {});
