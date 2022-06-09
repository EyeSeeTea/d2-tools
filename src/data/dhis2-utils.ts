import { HttpResponse } from "@eyeseetea/d2-api/api/common";
import { EventsPostResponse } from "@eyeseetea/d2-api/api/events";
import { CancelableResponse } from "@eyeseetea/d2-api/repositories/CancelableResponse";
import { Async } from "domain/entities/Async";
import _ from "lodash";
import { MetadataResponse } from "../types/d2-api";

export function getErrorFromResponse(res: MetadataResponse): string {
    console.debug(JSON.stringify(res, null, 4));

    return _(res.typeReports || [])
        .flatMap(typeReport => typeReport.objectReports || [])
        .flatMap(objectReport => objectReport.errorReports || [])
        .flatMap(errorReport => errorReport.message)
        .compact()
        .uniq()
        .join("\n");
}

export async function runMetadata(d2Response: CancelableResponse<MetadataResponse>): Promise<void> {
    const res = await d2Response.getData();
    return res.status !== "OK" ? Promise.reject(getErrorFromResponse(res)) : Promise.resolve(undefined);
}

export function getData<T>(d2Response: CancelableResponse<T>): Promise<T> {
    return d2Response.getData();
}

export function checkPostEventsResponse(res: HttpResponse<EventsPostResponse>): Async<void> {
    const importMessages = _(res.response.importSummaries || [])
        .map(importSummary => (importSummary.status !== "SUCCESS" ? importSummary.description : null))
        .compact()
        .value();

    return res.status !== "OK"
        ? Promise.reject([`POST /events error`, res.message, ...importMessages].join("\n") || "Unknown error")
        : Promise.resolve(undefined);
}
