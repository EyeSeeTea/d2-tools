import { option, string } from "cmd-ts";
import { D2Api } from "types/d2-api";

import SimpleNodeLogger from "simple-node-logger";

export const log = SimpleNodeLogger.createSimpleLogger({
    level: "all",
    logFilePath: "mylogfile.log",
    timestampFormat: "YYYY-MM-DD HH:mm:ss.SSS",
});

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
