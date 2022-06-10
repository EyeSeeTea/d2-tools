function printToConsole(msg: string): void {
    process.stdout.write(msg + "\n");
}

const log = {
    info: printToConsole,
    debug: printToConsole,
    error: printToConsole,
    warn: printToConsole,
};

export default log;
