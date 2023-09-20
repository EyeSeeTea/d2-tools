import fs from "fs";
import https from "https";
import path from "path";
import _ from "lodash";
import { Entry, Har } from "har-format";
import axios, { AxiosRequestConfig, Method } from "axios";
import { LoadingPlanRepository, Options } from "../domain/repositories/LoadingPlanRepository";
import { LoadingPlan } from "../domain/entities/LoadingPlan";

export interface RunHarResult {
    time: number;
    requestsCountErrors: number;
    requestsCount: number;
    requestsTime: number;
}

interface RepoOptions {
    harsFolder: string;
    harUrl: string;
}

const axios2 = axios.create({
    //timeout: 600 * 1000,
    //keepAlive pools and reuses TCP connections, so it's faster
    httpsAgent: new https.Agent({ keepAlive: true }),
    //maxRedirects: 10,
});

export class LoadingPlanHarRepository implements LoadingPlanRepository {
    cookie: string | undefined;

    constructor(private options: RepoOptions) {}

    async init(options: Options): Promise<void> {
        const username = encodeURIComponent(options.auth.username);
        const password = encodeURIComponent(options.auth.password);
        const config: AxiosRequestConfig = {
            method: "POST",
            url: `${options.url}/dhis-web-commons-security/login.action`,
            data: `j_username=${username}&j_password=${password}`,
            maxRedirects: 0,
            validateStatus: status => status < 400,
        };
        console.debug(`Get auth cookies: ${JSON.stringify(config)}`);

        const res = await axios2.request(config);
        const location: string | undefined = res.headers["location"];
        if (location && location.match(/failed/)) {
            throw new Error(`Login failed: ${config.data} -> location=${location}`);
        }
        const cookie = res.headers["set-cookie"]?.[0].split(";")[0] || "";
        console.debug(`Cookie from server: ${cookie}`);
        this.cookie = cookie;
    }

    async run(plan: LoadingPlan, options: Options): Promise<RunHarResult> {
        const har = this.loadHar(plan);
        const entries = har.log.entries.filter(
            entry =>
                !(entry.request.url.includes("login.action") && entry.request.method === "POST") &&
                entry.request.url.startsWith(this.options.harUrl) &&
                (entry.request.url.match(/https?:\/\//g) || []).length < 2
        );

        const startTime = new Date();
        const initialEntry = har.log.entries[0];
        if (!initialEntry) throw new Error("No initial entry");
        const initialClock = new Date().getTime();
        const initialTime = new Date(initialEntry.startedDateTime).getTime() / 1000;

        const entryGroups = _(entries)
            .map((entry, idx): Entry & { index: number } => ({
                ...entry,
                index: idx,
                time: new Date(entry.startedDateTime).getTime() / 1000,
            }))
            .groupBy(entry => {
                return Math.floor(entry.time * 100); // Group by 0.1-sec windows
            })
            .values()
            .value();

        const results = _.flatten(
            await sequentialPromises(entryGroups, async entriesGroup => {
                const time = entriesGroup[0]?.time;
                if (!time) throw new Error();
                const harElapsed = time - initialTime;
                const clockElapsed = (new Date().getTime() - initialClock) / 1000;
                const toWait = harElapsed - clockElapsed;
                if (toWait > 0) {
                    console.debug(`Wait: ${toWait}`);
                    await wait(toWait);
                }

                return parallelPromisesAll(entriesGroup, entry =>
                    this.runEntry(entry, entry.index, entries.length, options)
                );
            })
        );

        const requestsTime = _(results)
            .map(result => result.time)
            .sum();

        const errorCount = _(results)
            .filter(result => result.isError)
            .size();

        const elapsedTime = new Date().getTime() - startTime.getTime();

        return {
            requestsCountErrors: errorCount,
            time: elapsedTime,
            requestsCount: entries.length,
            requestsTime,
        };
    }

    private loadHar(plan: LoadingPlan): Har {
        const harPath = path.join(this.options.harsFolder, plan.name);
        console.debug(`Load HAR: ${harPath}`);
        const contents = fs.readFileSync(harPath, "utf8");
        return JSON.parse(contents);
    }

    private async runEntry(
        entry: Entry,
        index: number,
        total: number,
        options: Options
    ): Promise<RunEntryResult> {
        const { request } = entry;
        const { postData } = request;
        const url = request.url.replace(this.options.harUrl, options.url);

        const postParams = postData
            ? { headers: { "Content-Type": postData.mimeType }, data: postData.text }
            : {};

        const responseWasCached = entry.response.status === 0;
        if (responseWasCached) return { status: 0, time: 0, isError: false };

        const headers0 = _(request.headers)
            .map(header =>
                header.name.startsWith(":") || header.name == "Host"
                    ? undefined
                    : ([header.name, header.value] as [string, string])
            )
            .compact()
            .value();

        const headers = _(headers0)
            .concat([["Cookie", this.cookie] as [string, string]])
            .fromPairs()
            .value();

        const baseConfig: AxiosRequestConfig = {
            method: request.method as Method,
            url: url,
            headers,
            validateStatus: () => true,
            maxRedirects: 0,
        };

        const config = _.merge({}, baseConfig, postParams);
        const startTime = new Date();

        const res = await axios2.request(config).catch(err => {
            console.error("Axios error", err);
            return null;
        });
        const requestTime = new Date().getTime() - startTime.getTime();

        const resInfo = `[${res?.status || "UNKNOWN"}] ${config.method} ${url}`;
        console.debug(`[request-response:${index + 1}/${total}] ` + resInfo);

        const isSuccess =
            [0, 200, 201, 304, 404, 409].includes(res?.status || 0) ||
            request.url.includes("files/script") ||
            request.url.includes("staticContent");

        if (!isSuccess) {
            const data = { request, response: { status: res?.status, data: res?.data } };
            console.debug(
                `Request unsuccessful: ${request.method} ${request.url} (${res?.status})`,
                JSON.stringify(data, null, 4)
            );
        }
        if (!res) {
            return { status: 400, time: requestTime, isError: !isSuccess };
        } else {
            return { status: res.status, time: requestTime, isError: !isSuccess };
        }
    }
}

async function parallelPromisesAll<In, Out>(
    inputValues: In[],
    mapper: (value: In, index: number) => Promise<Out>
): Promise<Out[]> {
    return Promise.all(inputValues.map(mapper));
}

async function sequentialPromises<In, Out>(
    inputValues: In[],
    mapper: (value: In, index: number) => Promise<Out>
): Promise<Out[]> {
    const output: Out[] = [];
    let index = 0;
    for (const inputValue of inputValues) {
        const res = await mapper(inputValue, index);
        output.push(res);
        index++;
    }
    return output;
}

function wait(secs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 1000 * secs));
}

interface RunEntryResult {
    status: number;
    time: number;
    isError: boolean;
}
