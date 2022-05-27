import SimpleNodeLogger from "simple-node-logger";

const log = SimpleNodeLogger.createSimpleLogger({
    level: "all",
    logFilePath: "mylogfile.log",
    timestampFormat: "YYYY-MM-DD HH:mm:ss.SSS",
});

export default log;
