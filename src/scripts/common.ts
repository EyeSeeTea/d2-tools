import { option, optional, string, Type } from "cmd-ts";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { SocksProxyAgent } from "socks-proxy-agent";
import { D2Api } from "types/d2-api";
import { isElementOfUnion } from "utils/ts-utils";

export function getD2Api(url: string): D2Api {
    const options = getApiOptionsFromUrl(url);
    return buildD2Api(options);
}

function buildD2Api(options: { baseUrl: string; auth: Auth }): D2Api {
    const socksProxyUrl = process.env.ALL_PROXY;
    const agent = socksProxyUrl ? new SocksProxyAgent(socksProxyUrl) : undefined;
    return new D2Api({ ...options, backend: "fetch", agent: agent });
}

function getApiOptionsFromUrl(url: string): { baseUrl: string; auth: Auth } {
    const urlObj = new URL(url);
    const decode = decodeURIComponent;
    const auth = { username: decode(urlObj.username), password: decode(urlObj.password) };
    return { baseUrl: urlObj.origin + urlObj.pathname, auth };
}
type Auth = { username: string; password: string };

interface D2ApiArgs {
    url: string;
    auth?: Auth;
}

export function getD2ApiFromArgs(args: D2ApiArgs): D2Api {
    const { baseUrl, auth } = args.auth
        ? { baseUrl: args.url, auth: args.auth }
        : getApiOptionsFromUrl(args.url);
    return buildD2Api({ baseUrl, auth });
}

export function getApiUrlOption(options?: { long: string }) {
    return option({
        type: string,
        long: options?.long ?? "url",
        description: "http://USERNAME:PASSWORD@HOST:PORT",
    });
}

export function getApiUrlOptions() {
    return {
        url: option({
            type: string,
            long: "url",
            description: "http[s]://[USERNAME:PASSWORD@]HOST:PORT",
        }),
        auth: option({
            type: optional(AuthString),
            long: "auth",
            description: "USERNAME:PASSWORD",
        }),
    };
}

export type Pair = [string, string];

export const StringPairSeparatedByDash: Type<string, Pair> = {
    async from(str) {
        const [id1, id2] = str.split("-");
        if (!id1 || !id2) throw new Error(`Invalid pair: ${str} (expected ID1-ID2)`);
        return [id1, id2];
    },
};

export const StringsSeparatedByCommas: Type<string, string[]> = {
    async from(str) {
        const values = _.compact(str.split(","));
        if (_(values).isEmpty()) throw new Error("Value cannot be empty");
        return values;
    },
};

export const HierarchyLevel: Type<string, number> = {
    async from(str) {
        const n = Number(str);
        if (!Number.isInteger(n) || n < 0) throw new Error(`Not a valid hierarchy level: ${n}`);
        return n;
    },
};

export const OrgUnitPath: Type<string, string> = {
    async from(str) {
        if (!isOrgUnitPath(str)) throw new Error(`Not a dhis2 orgunit path: ${str}`);
        return str;
    },
};

export const IDString: Type<string, string> = {
    async from(str) {
        if (_(str).isEmpty()) throw new Error("Value cannot be empty");
        if (str.length !== 11) throw new Error("ID must be 11 char long");
        return str;
    },
};

// Return true if str is an organisation unit path.
// Example of a valid path: "/kbv9iwCpokl/ByqsEM8ZsAz/emI2bZvcq9K"
function isOrgUnitPath(str: string): boolean {
    return str.startsWith("/") && str.slice(1).split("/").every(isUid);
}

// Return true if uid is a valid dhis2 uid.
// Example of a valid uid: "ByqsEM8ZsAz"
function isUid(uid: string): boolean {
    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    const alnum = alpha.concat("0123456789".split(""));

    const isAlpha = (c: string | undefined) => c !== undefined && alpha.includes(c);
    const areAllAlnum = (str: string) => str.split("").every(c => alnum.includes(c));

    return uid.length === 11 && isAlpha(uid[0]) && areAllAlnum(uid.slice(1));
}

export const IdsSeparatedByCommas: Type<string, string[]> = {
    async from(str) {
        const values = _.compact(str.split(","));
        if (_(values).isEmpty()) throw new Error("Value cannot be empty");
        if (!_.every(values, item => item.length === 11)) throw new Error("IDs must be 11 char long");
        return values;
    },
};

export const AuthString: Type<string, Auth> = {
    async from(str) {
        const [username, password] = str.split(":");
        if (!username || !password) throw new Error(`Invalid pair: ${str} (expected USERNAME:PASSWORD)`);
        return { username, password };
    },
};

export function choiceOf<T extends string>(values: readonly T[]): Type<string, T> {
    return {
        async from(str) {
            if (!isElementOfUnion<T>(str, values)) throw new Error(`Valid values: ${values.join(",")}`);
            return str;
        },
    };
}

export const periodYears: Type<string, string[]> = {
    async from(str) {
        const values = _.compact(str.split(","));
        if (_(values).isEmpty()) throw new Error("Value cannot be empty");
        if (!_.every(values, item => item.length === 4)) throw new Error("Year must be 4 char long");
        return values;
    },
};

function isDir(str: string): boolean {
    const stat = fs.statSync(str);

    return stat.isDirectory();
}

export const FilePath: Type<string, string> = {
    async from(str) {
        // path does not resolve ~ to home dir
        if (str.includes("~")) {
            str = str.replace("~", require("os").homedir());
        }

        const resolved = path.resolve(str);

        if (!fs.existsSync(resolved)) {
            const subPath = resolved.substring(0, resolved.lastIndexOf("/"));
            if (fs.existsSync(subPath) && isDir(subPath)) {
                return resolved;
            }
            throw new Error("Path doesn't exist");
        }

        return resolved;
    },
};
