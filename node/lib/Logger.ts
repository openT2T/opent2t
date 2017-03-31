import {ILogger} from "./ILogger";
import {Utilities} from "./LoggerUtilities";
import {LoggerInstance} from "winston";
import * as winston from "winston";

const timeStamp: string = "timestamp";

export class Logger implements ILogger {

    private static flag: boolean = true;
    private globalLogLevel: string = "debug";
    private logger: LoggerInstance;
    private transportList: Array<any> = [];

    constructor(logLevel?: string, filename?: string, logger?: LoggerInstance) {
        this.logger = logger || <any> winston;

        // TODO: Gate loglevel strings to allowed/supported values only.
        if (logLevel) {
            this.globalLogLevel = logLevel;
        }

        let consoleTransport = new winston.transports.Console({
            colorize: true,
            level: this.globalLogLevel,
        });

        this.logger.configure({
            transports: [
                consoleTransport,
            ],
        });

        this.transportList.push(consoleTransport);

        if (Logger.flag === true && filename ) {
            let fileTransport = new winston.transports.File({
                filename,
                handleExceptions: true,
                level: this.globalLogLevel,
            });

            this.logger.configure({
                transports: [
                    consoleTransport,
                    fileTransport,
                ],
            });

            this.transportList.push(fileTransport);
            Logger.flag = false;
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

    public getConfiguredTransports(): Array<any> {
        return this.transportList;
    }

    public normalizeWith(normalizer: (logObject: any) => any): ILogger {
        this.normalize = normalizer;
        return this;
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
