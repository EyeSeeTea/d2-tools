import { isElementOfUnion, UnionFromValues } from "./ts-utils";

const logLevels = ["debug", "info", "warn", "error"] as const;
export type LogLevel = UnionFromValues<typeof logLevels>;

const levelFromEnv = process.env["LOG_LEVEL"] || "";
const level = isElementOfUnion(levelFromEnv, logLevels) ? levelFromEnv : "info";
const levelIndex = logLevels.indexOf(level);

function getLogger(logLevelIndex: number, level: LogLevel) {
    return function writer(message: string) {
        if (logLevelIndex >= levelIndex) {
            const ts = new Date().toISOString();
            process.stderr.write(`[${level}] [${ts}] ${message}\n`);
        }
    };
}

const logger = {
    debug: getLogger(0, "debug"),
    info: getLogger(1, "info"),
    warn: getLogger(2, "warn"),
    error: getLogger(3, "error"),
};

export default logger;
