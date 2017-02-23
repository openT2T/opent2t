export interface ILogger {
    error(msg: string, logObject?): void;
    warn(msg: string, logObject?): void;
    info(msg: string, logObject?): void;
    verbose(msg: string, logObject?): void;
    debug(msg: string, logObject?): void;
    silly(msg: string, logObject?): void;
    addTransport(transportObject): void;
    listSupportedTransports(): Array<string>;
    removeTransport(transportId: string): void;
    configureLogLevel(logLevel: string, transportId?: string): void;
}
