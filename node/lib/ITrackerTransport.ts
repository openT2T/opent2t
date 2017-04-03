import { TraceLevel } from "./Logger";

export interface ITrackerTransport {
    name: string;
    event(name: string, duration: number, data?: { [key: string]: any; }): void;
    trace(message: string, traceLevel: TraceLevel, data?: { [key: string]: any; }): void;
    metric(
        name: string,
        value: number,
        count?: number,
        min?: number,
        max?: number,
        data?: { [key: string]: any; }): void;
    exception(exception: Error, data?: { [key: string]: any; }): void;
}
