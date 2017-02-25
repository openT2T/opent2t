export interface ILogger {
    error(msg: string, logObject?): void;
    warn(msg: string, logObject?): void;
    info(msg: string, logObject?): void;
    verbose(msg: string, logObject?): void;
    debug(msg: string, logObject?): void;
    getConfiguredTransports(): Array<any>;
}
