//
import isArray from "d2-utilizr/lib/isArray";
import { getApi } from "../d2/d2Instance";
import { getProgramThrowIfNotFound, EventProgram } from "../metaData";

import { convertServerRelationshipToClient } from "./convertServerToClient";

async function getRelationships(queryParams, relationshipTypes) {
    const api = getApi();
    const apiRes = await api.get("tracker/relationships", { ...queryParams });
    return apiRes?.instances && isArray(apiRes.instances)
        ? apiRes.instances?.map(rel => convertServerRelationshipToClient(rel, relationshipTypes))
        : null;
}

export function getRelationshipsForEvent(eventId, programId, programStageId) {
    const program = getProgramThrowIfNotFound(programId);
    const stage = program instanceof EventProgram ? program.stage : program.getStage(programStageId);
    const relationshipTypes = stage?.relationshipTypes || [];
    return getRelationships(
        { event: eventId, fields: ["from,to,relationshipType,relationship"] },
        relationshipTypes
    );
}
