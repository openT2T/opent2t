
import { DeviceInterface } from "./DeviceInterface";
import { IDeviceInterfaceConverter } from "./IDeviceInterfaceConverter";

/**
 * Reads and writes device interface specifications in TypeScript type-definition format.
 */
export class TypeScriptConverter implements IDeviceInterfaceConverter {
    public readAsync(sourceFilePath: string): Promise<DeviceInterface> {
        return new Promise<DeviceInterface>((resolve, reject) => {
            reject(new Error("not implemented"));
        });
    }

    public writeAsync(deviceInterface: DeviceInterface, targetFilePath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            reject(new Error("not implemented"));
        });
    }
}
