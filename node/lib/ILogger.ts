export interface ILogger {
    error(msg:string, logObject?): void;
    warn(msg:string, lobObject?): void;
    info(msg:string, logObject?): void;
    verbose(msg:string, lobObject?): void;
    debug(msg:string, logObject?): void;
    silly(msg:string, lobObject?): void;    
}