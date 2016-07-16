
import { DeviceInterface } from "./DeviceInterface";

export interface ISchemaProvider {
    getDeviceInterfaceAsync(interfaceId: string, version: string): Promise<DeviceInterface>;
}
