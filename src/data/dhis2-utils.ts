import _ from "lodash";
import { MetadataResponse, CancelableResponse } from "../types/d2-api";

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
