import SimpleLogger, { STANDARD_LEVELS } from "simple-node-logger";

const manager = new SimpleLogger();

manager.createConsoleAppender({
    writer(s: string) {
        process.stderr.write(s + "\n");
    },
});

const logLevelFromEnv = process.env["LOG_LEVEL"] as STANDARD_LEVELS;
const logger = manager.createLogger(undefined, logLevelFromEnv || "info");

export default logger;
