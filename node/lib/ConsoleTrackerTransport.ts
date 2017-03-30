/* tslint:disable:no-console */
import {ITrackerTransport} from "./ITrackerTransport";
import { TraceLevel } from "./Tracker";

/**
 * Telemetry tracking transport that writes data to the console.  This is mostly useful for debugging.
 */
export class ConsoleTrackerTransport implements ITrackerTransport {

    public name: string = "Console Tracker";

    public event(name: string, duration: number, data?: { [key: string]: any; }): void {
        console.log(`Event: ${name}, Duration: ${duration}, Data: ${JSON.stringify(data)}`);
    }

    public trace(message: string, traceLevel: TraceLevel, data?: { [key: string]: any; }): void {
        console.log(`Trace: ${message}, Level: ${traceLevel}, Data: ${JSON.stringify(data)}`);
    }

    public metric(
        name: string,
        value: number,
        count?: number,
        min?: number,
        max?: number,
        data?: { [key: string]: any; }): void {
        console.log(`Metric: ${name}, Value: ${value}, Data: ${JSON.stringify(data)}`);
    }

    public exception(exception: Error, data?: { [key: string]: any; }): void {
        console.log(`Exception: ${exception}, Data: ${JSON.stringify(data)}`);
    }
}
