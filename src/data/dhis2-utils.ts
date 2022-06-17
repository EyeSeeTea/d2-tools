import { CancelableResponse } from "@eyeseetea/d2-api/repositories/CancelableResponse";
import _ from "lodash";
import { Id, MetadataResponse } from "../types/d2-api";

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

export function promiseMap<T, S>(inputValues: T[], mapper: (value: T) => Promise<S>): Promise<S[]> {
    const reducer = (acc$: Promise<S[]>, inputValue: T): Promise<S[]> =>
        acc$.then((acc: S[]) =>
            mapper(inputValue).then(result => {
                acc.push(result);
                return acc;
            })
        );
    return inputValues.reduce(reducer, Promise.resolve([]));
}

export async function getInChunks<T>(ids: Id[], getter: (idsGroup: Id[]) => Promise<T[]>): Promise<T[]> {
    const objsCollection = await promiseMap(_.chunk(ids, 300), idsGroup => getter(idsGroup));
    return _.flatten(objsCollection);
}
