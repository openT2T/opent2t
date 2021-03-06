import { ITrackerTransport } from "./ITrackerTransport";
import { TraceLevel } from "./Logger";
import * as applicationinsights from "applicationinsights";
const uuidv4 = require("uuid/v4");

export class AppInsightsTrackerTransport implements ITrackerTransport {

    private client: any;

    constructor(key: string) {
        this.client = applicationinsights.getClient(key);
        let sessionKey = this.client.context.keys.sessionId;
        this.client.context.tags[sessionKey] = uuidv4();
    }

    public event(name: string, duration: number, data?: { [key: string]: any; }): void {
        let properties = this.createProperties(data);
        properties.duration = duration.toString();
        this.client.trackEvent(name, properties);
    }

    public trace(message: string, traceLevel: TraceLevel, data?: { [key: string]: any; }): void {
        let properties = this.createProperties(data);
        this.client.trackTrace(message, traceLevel, properties);
    }

    public metric(
        name: string,
        value: number,
        count?: number,
        min?: number,
        max?: number,
        data?: { [key: string]: any; }): void {
        let properties = this.createProperties(data);
        this.client.trackMetric(name, value, count, min, max, undefined, properties);
    }

    public exception(exception: Error, data?: { [key: string]: any; }): void {
        let properties = this.createProperties(data);
        this.client.trackException(exception, properties);
    }

    private createProperties(data?: { [key: string]: any; }): { [key: string]: string; } {
        let properties: { [key: string]: string; } = {};

        if (data) {
            for (let attr in data) {
                if (data.hasOwnProperty(attr)) {
                    properties[attr] = data[attr].toString();
                }
            }
        }

        return properties;
    }
}
