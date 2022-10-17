//
import { convertServerToClient } from "../../../../../../../converters";

const getValuesById = (attributeValues = []) =>
    attributeValues.reduce((acc, { attribute, value }) => {
        acc[attribute] = value;
        return acc;
    }, {});

export const convertToClientTeis = (apiTeis, columnsMetaForDataFetching, programId) =>
    apiTeis.map(tei => {
        const attributeValuesById = getValuesById(tei.attributes);
        const record = columnsMetaForDataFetching
            .map(({ id, mainProperty, type }) => {
                let value;
                if (mainProperty) {
                    value = tei[id];
                } else {
                    value = attributeValuesById[id];
                }

                return {
                    id,
                    value: convertServerToClient(value, type),
                };
            })
            .filter(({ value }) => value != null)
            .reduce((acc, { id, value }) => {
                acc[id] = value;
                return acc;
            }, {});

        const programOwner = tei.programOwners.find(({ program }) => program === programId)?.orgUnit;
        if (programOwner) {
            record.programOwner = programOwner;
        }

        return {
            id: tei.trackedEntity,
            record,
        };
    });
