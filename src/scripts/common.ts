import { option, string, Type } from "cmd-ts";
import { D2Api } from "types/d2-api";

export function getD2Api(baseUrl: string): D2Api {
    const url = new URL(baseUrl);
    const decode = decodeURIComponent;
    const auth = { username: decode(url.username), password: decode(url.password) };
    return new D2Api({ baseUrl: url.origin + url.pathname, auth });
}

export function getApiUrlOption(options?: { long: string }) {
    return option({
        type: string,
        long: options?.long ?? "url",
        description: "http://USERNAME:PASSWORD@HOST:PORT",
    });
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
        return str.split(",");
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
