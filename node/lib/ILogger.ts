export interface ILogger {
    error(msg: string, logObject?: any): void;
    warn(msg: string, logObject?: any): void;
    info(msg: string, logObject?: any): void;
    verbose(msg: string, logObject?: any): void;
    debug(msg: string, logObject?: any): void;
    getConfiguredTransports(): Array<any>;
}
