import { CancelableResponse } from "@eyeseetea/d2-api/repositories/CancelableResponse";
import _ from "lodash";
import log from "utils/log";
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

export async function runMetadata(
    d2Response: CancelableResponse<MetadataResponse>,
    options = { description: "" }
): Promise<void> {
    const res = await d2Response.getData();
    if (res.status !== "OK") {
        return Promise.reject(getErrorFromResponse(res));
    } else {
        const description = options.description || "metadata";
        log.debug(`POST ${description}: ${res.status} ${JSON.stringify(res.stats)}`);
        Promise.resolve(undefined);
    }
}
