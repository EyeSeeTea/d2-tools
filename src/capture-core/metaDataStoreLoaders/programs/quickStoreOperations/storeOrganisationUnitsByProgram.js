//
import { quickStore } from "../../IOUtils";
import { getContext } from "../../context";

const convert = response =>
    Object.keys(response).map(id => ({
        id,
        organisationUnits: response[id].reduce((acc, orgUnitId) => {
            acc[orgUnitId] = true;
            return acc;
        }, {}),
    }));

export const storeOrganisationUnitsByProgram = programIds => {
    const query = {
        resource: "programs/orgUnits",
        params: {
            programs: programIds.join(","),
        },
    };

    return quickStore({
        query,
        storeName: getContext().storeNames.ORGANISATION_UNITS_BY_PROGRAM,
        convertQueryResponse: convert,
    });
};
