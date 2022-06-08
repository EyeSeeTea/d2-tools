import SimpleLogger from "simple-node-logger";

const manager = new SimpleLogger();

manager.createConsoleAppender({
    writer(s: string) {
        process.stderr.write(s + "\n");
    },
});

const logger = manager.createLogger(undefined, "all");

export default logger;
