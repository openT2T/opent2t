import { ITrackerTransport } from "./ITrackerTransport";

export enum TraceLevel {
    Verbose = 0,
    Info = 1,
    Warn = 2,
    Error = 3
}

export class Tracker {

    private transportList: Array<ITrackerTransport> = [];

    constructor(...args: ITrackerTransport[]) {
        for (let i = 0; i < args.length; i++) {
            this.addTracker(args[i]);
        }
    }

    public addTracker(tracker: ITrackerTransport): void {
        let index = this.transportList.indexOf(tracker);

        if (index === -1) {
            this.transportList.push(tracker);
        }
    }

    public removeTracker(tracker: ITrackerTransport): void {
        let index = this.transportList.indexOf(tracker);

        if (index > -1) {
            this.transportList.splice(index, 1);
        }
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

    private callAllTransports(action: (tracker: ITrackerTransport) => void): void {
        this.transportList.forEach((tracker: ITrackerTransport) => {
            action(tracker);
        });
    }
}
