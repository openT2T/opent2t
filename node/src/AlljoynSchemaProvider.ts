
import { ISchemaProvider } from "./ISchemaProvider";
import { DeviceInterface } from "./DeviceInterface";

export class AlljoynSchemaProvider implements ISchemaProvider {
    public getDeviceInterfaceAsync(interfaceId: string, version: string): Promise<DeviceInterface> {
        return new Promise<DeviceInterface>((resolve, reject) => {
            reject(new Error("not implemented"));
        });
    }
}