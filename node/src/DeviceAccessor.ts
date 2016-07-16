
import { IDevice } from "./ITranslator";

export class DeviceAccessor {
    public static getProperty(
            device: IDevice,
            interfaceId: string,
            propertyName: string): Promise<any> {
        throw new Error("not implemented");
    }

    public static setProperty(
            device: IDevice,
            interfaceId: string,
            propertyName: string,
            value: any): Promise<void> {
        throw new Error("not implemented");
    }

    public static invokeMethod(
            device: IDevice,
            interfaceId: string,
            methodName: string,
            args: any[]): Promise<any> {
        throw new Error("not implemented");
    }

    public addSignalListener(
            device: IDevice,
            interfaceId: string,
            signalName: string,
            callback: (signalValue: any) => void): Promise<void> {
        throw new Error("not implemented");
    }
}
