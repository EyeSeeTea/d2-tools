import { isElementOfUnion, UnionFromValues } from "./ts-utils";

const logLevels = ["debug", "info", "warn", "error"] as const;
export type LogLevel = UnionFromValues<typeof logLevels>;

// data layer -> domain layer
const levelFromEnv = process.env["LOG_LEVEL"] || "";
const level = isElementOfUnion(levelFromEnv, logLevels) ? levelFromEnv : "info";
// LOG_LEVEL=silent disables all output (used e.g. in tests). Any index above the levels works.
const levelIndex = levelFromEnv === "silent" ? logLevels.length : logLevels.indexOf(level);

function getLogger(logLevelIndex: number, level: LogLevel) {
    return function writer(message: string) {
        if (logLevelIndex >= levelIndex) {
            const ts = new Date().toISOString();
            process.stderr.write(`[${level.toUpperCase()} ${ts}] ${message}\n`);
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
