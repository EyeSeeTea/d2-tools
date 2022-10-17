import _ from "lodash";
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
        const values = _.compact(str.split(","));
        if (_(values).isEmpty()) throw new Error("Value cannot be empty");
        return values;
    },
};
