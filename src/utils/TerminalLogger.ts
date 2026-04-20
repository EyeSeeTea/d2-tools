import { Logger } from "domain/logger/Logger";
import logger from "utils/log";

export class TerminalLogger implements Logger {
    debug(message: string): void {
        logger.debug(message);
    }

    info(message: string): void {
        logger.info(message);
    }

    warn(message: string): void {
        logger.warn(message);
    }

    error(message: string): void {
        logger.error(message);
    }
}
