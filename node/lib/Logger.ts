import { ITrackerTransport } from "./ITrackerTransport";
import * as winston from "winston";

export enum TraceLevel {
    Verbose = 0,
    Info = 1,
    Warn = 2,
    Error = 3
}

/**
 * Provides logging and telemetry processing functionality.
 * 
 * Logging is done via winston transports.
 * Telemetry is done via ITrackerTransports.
 */
export class Logger {

    private globalLogLevel: string;
    private logger: any = new winston.Logger();
    private transportList: Array<ITrackerTransport> = [];

    /**
     * Creates a openT2T logger.
     * @param {string} logLevel The global winston log level.
     * @param {boolean} enableConsole Whether to enable console logging.
     */
    constructor(logLevel: string = "verbose", enableConsole: boolean = true) {
        this.globalLogLevel = logLevel;

        if (enableConsole) {
            this.addLoggerTransport(winston.transports.Console, { colorize: true, level: this.globalLogLevel });
        }
    }

    /**
     * Add a new winston logging transport
     * @param {any} transport The winston logging transport to add
     * @param {any} options The transport options
     */
    public addLoggerTransport(transport: any, options: any): void {
        this.logger.add(transport, options);
    }

    /**
     * Remove a winston logging transport
     * @param {any} transport The winston logging transport to remove
     */
    public removeLoggerTransport(transport: any): void {
        this.logger.remove(transport);
    }

    /**
     * Add a telemetry tracker transport
     * @param {ITrackerTransport} transport The telemetry tracker transport to add
     */
    public addTrackerTransport(transport: ITrackerTransport): void {
        let index = this.transportList.indexOf(transport);

        if (index === -1) {
            this.transportList.push(transport);
        }
    }

    /**
     * Remove a telemetry tracker transport
     * @param {ITrackerTransport} transport The telemetry tracker transport to remove
     */
    public removeTrackerTransport(transport: ITrackerTransport): void {
        let index = this.transportList.indexOf(transport);

        if (index > -1) {
            this.transportList.splice(index, 1);
        }
    }

    /**
     * Emit a winston log error
     * @param {string} msg The error message
     * @param {any} logObject Error properties
     */
    public error(msg: string, logObject?: any): void {
        this.logger.error(msg, logObject);
    }

    /**
     * Emit a winston log warning
     * @param {string} msg The warning message
     * @param {any} logObject Warning properties
     */
    public warn(msg: string, logObject?: any): void {
        this.logger.warn(msg, logObject);
    }

    /**
     * Emit a winston log information message
     * @param {string} msg The info message
     * @param {any} logObject Info message properties
     */
    public info(msg: string, logObject?: any): void {
        this.logger.info(msg, logObject);
    }

    /**
     * Emit a winston log verbose message
     * @param {string} msg The verbose message
     * @param {any} logObject Verbose message properties
     */
    public verbose(msg: string, logObject?: any): void {
        this.logger.verbose(msg, logObject);
    }

    /**
     * Emit a winston log debug message
     * @param {string} msg The debug message
     * @param {any} logObject Debug message properties
     */
    public debug(msg: string, logObject?: any): void {
        this.logger.debug(msg, logObject);
    }

    /**
     * Emit a telemetry event
     * @param {string} name Event name
     * @param {number} duration Event duration in milliseconds
     * @param {*} data Event data
     */
    public event(name: string, duration: number, data?: { [key: string]: any; }): void {
        this.callAllTrackingTransports(t => t.event(name, duration, data));
    }

    /**
     * Emit a telemetry trace
     * @param {string} message Trace message
     * @param {TraceLevel} traceLevel Trace level
     * @param {*} data Trace data
     */
    public trace(message: string, traceLevel: TraceLevel, data?: { [key: string]: any; }): void {
        this.callAllTrackingTransports(t => t.trace(message, traceLevel, data));
    }

    /**
     * Emit a telemetry metric
     * @param {string} name Metric name
     * @param {number} value Metric value
     * @param {number} count Metric count
     * @param {number} min Min value
     * @param {number} max Max value
     * @param {*} data Metric data
     */
    public metric(
        name: string,
        value: number,
        count?: number,
        min?: number,
        max?: number,
        data?: { [key: string]: any; }): void {
        this.callAllTrackingTransports(t => t.metric(name, value, count, min, max, data));
    }

    /**
     * Emit a telemetry exception
     * @param {Error} exception The error that was encountered
     * @param {*} data Exception data
     */
    public exception(exception: Error, data?: { [key: string]: any; }): void {
        this.callAllTrackingTransports(t => t.exception(exception, data));
    }

    /**
     * Gets the names of the configured winston logging transports
     */
    public getConfiguredLoggerTransports(): Array<string> {
        return this.logger._names;
    }

    private callAllTrackingTransports(action: (tracker: ITrackerTransport) => void): void {
        this.transportList.forEach((tracker: ITrackerTransport) => {
            action(tracker);
        });
    }
}
