//
import uuid from "d2-utilizr/src/uuid";
import moment from "moment";
import { getFormattedStringFromMomentUsingEuropeanGlyphs } from "capture-core-utils/date";
import { capitalizeFirstLetter } from "capture-core-utils/string/capitalizeFirstLetter";
import {
    getTrackerProgramThrowIfNotFound,
    getTrackedEntityTypeThrowIfNotFound,
} from "../../../../../metaData";
import { convertFormToClient, convertClientToServer } from "../../../../../converters";
import { getDisplayName } from "../../../../../trackedEntityInstances/getDisplayName";
import { convertDataEntryValuesToClientValues } from "../../../../DataEntry/common/convertDataEntryValuesToClientValues";
import { getDataEntryKey } from "../../../../DataEntry/common/getDataEntryKey";

function getTrackerProgramMetadata(programId) {
    const program = getTrackerProgramThrowIfNotFound(programId);
    return {
        form: program.enrollment.enrollmentForm,
        attributes: program.trackedEntityType.attributes,
        tetName: program.trackedEntityType.name,
    };
}

function getTETMetadata(tetId) {
    const tet = getTrackedEntityTypeThrowIfNotFound(tetId);
    return {
        form: tet.teiRegistration.form,
        attributes: tet.attributes,
        tetName: tet.name,
    };
}

function getMetadata(programId, tetId) {
    return programId ? getTrackerProgramMetadata(programId) : getTETMetadata(tetId);
}

function getClientValuesForFormData(formValues, formFoundation) {
    const clientValues = formFoundation.convertValues(formValues, convertFormToClient);
    return clientValues;
}

function getServerValuesForMainValues(values, meta, formFoundation) {
    const clientValues = convertDataEntryValuesToClientValues(values, meta, formFoundation) || {};

    // potientally run this through a server to client converter for enrollment, the same way as for event
    const serverValues = Object.keys(clientValues).reduce((acc, key) => {
        const value = clientValues[key];
        const type = meta[key].type;
        acc[key] = convertClientToServer(value, type);
        return acc;
    }, {});

    return serverValues;
}

function getPossibleTetFeatureTypeKey(serverValues) {
    return Object.keys(serverValues).find(key => key.startsWith("FEATURETYPE_"));
}

function buildGeometryProp(key, serverValues) {
    if (!serverValues[key]) {
        return undefined;
    }
    const type = capitalizeFirstLetter(key.replace("FEATURETYPE_", "").toLocaleLowerCase());
    return {
        type,
        coordinates: serverValues[key],
    };
}

export function getRelationshipNewTei(dataEntryId, itemId, state) {
    const dataEntryKey = getDataEntryKey(dataEntryId, itemId);
    const formValues = state.formsValues[dataEntryKey];
    const { programId, orgUnit } = state.newRelationshipRegisterTei;
    const tetId = state.newRelationship.selectedRelationshipType.to.trackedEntityTypeId;

    const { attributes: metaDataAttributes, form: formFoundation, tetName } = getMetadata(programId, tetId);
    const clientValuesForFormData = getClientValuesForFormData(formValues, formFoundation);
    const displayName = getDisplayName(clientValuesForFormData, metaDataAttributes, tetName);

    const serverValuesForFormValues = formFoundation.convertValues(
        clientValuesForFormData,
        convertClientToServer
    );
    const serverValuesForMainValues = getServerValuesForMainValues(
        state.dataEntriesFieldsValue[dataEntryKey],
        state.dataEntriesFieldsMeta[dataEntryKey],
        formFoundation
    );

    // $FlowFixMe
    const attributes = Object.keys(serverValuesForFormValues).map(key => ({
        attribute: key,
        value: serverValuesForFormValues[key],
    }));

    const enrollment = programId
        ? {
              program: programId,
              status: "ACTIVE",
              orgUnit: orgUnit.id,
              occurredAt: getFormattedStringFromMomentUsingEuropeanGlyphs(moment()),
              attributes,
              ...serverValuesForMainValues,
          }
        : null;

    const tetFeatureTypeKey = getPossibleTetFeatureTypeKey(serverValuesForFormValues);
    let geometry;
    if (tetFeatureTypeKey) {
        geometry = buildGeometryProp(tetFeatureTypeKey, serverValuesForFormValues);
        delete serverValuesForFormValues[tetFeatureTypeKey];
    }

    const teiPayload = {
        // $FlowFixMe
        attributes: !enrollment ? attributes : undefined,
        orgUnit: orgUnit.id,
        trackedEntityType: tetId,
        geometry,
        enrollments: enrollment ? [enrollment] : [],
    };

    return {
        data: teiPayload,
        name: displayName,
        id: uuid(),
    };
}
