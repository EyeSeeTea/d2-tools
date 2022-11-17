import { option, optional, string, Type } from "cmd-ts";
import _ from "lodash";
import { D2Api } from "types/d2-api";
import { isElementOfUnion } from "utils/ts-utils";

export function getD2Api(url: string): D2Api {
    const { baseUrl, auth } = getApiOptionsFromUrl(url);
    return new D2Api({ baseUrl, auth });
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
    return new D2Api({ baseUrl, auth });
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

export const IDString: Type<string, string> = {
    async from(str) {
        if (_(str).isEmpty()) throw new Error("Value cannot be empty");
        if (str.length !== 11) throw new Error("ID must be 11 char long");
        return str;
    },
};

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
