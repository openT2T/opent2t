import { ITrackerTransport } from "./ITrackerTransport";
import { Utilities } from "./LoggerUtilities";
import * as winston from "winston";

const timeStamp: string = "timestamp";

export enum TraceLevel {
    Verbose = 0,
    Info = 1,
    Warn = 2,
    Error = 3
}

export class Logger {

    private globalLogLevel: string;
    private logger: any = new winston.Logger();
    private transportList: Array<ITrackerTransport> = [];

    constructor(logLevel: string = "verbose", enableConsole: boolean = true) {
        this.globalLogLevel = logLevel;

        if (enableConsole) {
            this.addLoggerTransport(winston.transports.Console, { colorize: true, level: this.globalLogLevel });
        }
    }

    public addLoggerTransport(transport: any, options: any): void {
        this.logger.add(transport, options);
    }

    public removeLoggerTransport(transport: any): void {
        this.logger.remove(transport);
    }

    public addTrackerTransport(transport: ITrackerTransport): void {
        let index = this.transportList.indexOf(transport);

        if (index === -1) {
            this.transportList.push(transport);
        }
    }

    public removeTrackerTransport(transport: ITrackerTransport): void {
        let index = this.transportList.indexOf(transport);

        if (index > -1) {
            this.transportList.splice(index, 1);
        }
    }

    public error(msg: string, logObject?: any): void {
        this.logger.error(msg, logObject);
    }

    public warn(msg: string, logObject?: any): void {
        this.logger.warn(msg, logObject);
    }

    public info(msg: string, logObject?: any): void {
        this.logger.info(msg, logObject);
    }

    public verbose(msg: string, logObject?: any): void {
        this.logger.verbose(msg, logObject);
    }

    public debug(msg: string, logObject?: any): void {
        this.logger.debug(msg, logObject);
    }

    public event(name: string, duration: number, data?: { [key: string]: any; }): void {
        this.callAllTransports(t => t.event(name, duration, data));
    }

    public trace(message: string, traceLevel: TraceLevel, data?: { [key: string]: any; }): void {
        this.callAllTransports(t => t.trace(message, traceLevel, data));
    }

    public metric(
        name: string,
        value: number,
        count?: number,
        min?: number,
        max?: number,
        data?: { [key: string]: any; }): void {
        this.callAllTransports(t => t.metric(name, value, count, min, max, data));
    }

    public exception(exception: Error, data?: { [key: string]: any; }): void {
        this.callAllTransports(t => t.exception(exception, data));
    }

    public getConfiguredTransports(): Array<string> {
        return this.logger._names;
    }

    public normalizeWith(normalizer: (logObject: any) => any): Logger {
        this.normalize = normalizer;
        return this;
    }

    private callAllTransports(action: (tracker: ITrackerTransport) => void): void {
        this.transportList.forEach((tracker: ITrackerTransport) => {
            action(tracker);
        });
    }

    private normalize = (logObject: any) => {
        if (logObject === null || logObject === undefined) {
            return;
        }

        let cLogObject = Utilities.cloneObject(logObject);
        cLogObject[timeStamp] = Date.now();
        return cLogObject;
    };
}
