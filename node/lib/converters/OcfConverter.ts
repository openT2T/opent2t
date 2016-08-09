
import {
    DeviceInterface,
    DeviceMethod,    // tslint:disable-line:no-unused-variable
    DeviceParameter, // tslint:disable-line:no-unused-variable
    DeviceProperty,  // tslint:disable-line:no-unused-variable
    JsonSchema,      // tslint:disable-line:no-unused-variable
} from "../DeviceInterface";

import * as fs from "mz/fs";

/**
 * Reads and writes device interface specifications in OCF RAML+JSON format.
 */
export class OcfConverter {
    public static readDeviceInterfacesFromFiles(
            ramlFilePath: string, jsonFilePath: string): DeviceInterface[] {
        let raml = fs.readFileSync(ramlFilePath, "utf8");
        let json = fs.readFileSync(jsonFilePath, "utf8");
        return OcfConverter.readDeviceInterfaces(raml, json);
    }

    public static async readDeviceInterfacesFromFilesAsync(
            ramlFilePath: string, jsonFilePath: string): Promise<DeviceInterface[]> {
        let raml = await fs.readFile(ramlFilePath, "utf8");
        let json = await fs.readFile(jsonFilePath, "utf8");
        return OcfConverter.readDeviceInterfaces(raml, json);
    }

    public static readDeviceInterfaces(raml: string, json: string): DeviceInterface[] {
        throw new Error("not implemented");
    }

    public static async writeDeviceInterfacesToFileAsync(
            deviceInterfaces: DeviceInterface[], ramlFilePath: string, jsonFilePath: string): Promise<void> {
        let ramlAndJson: { raml: string, json: string} =
                await OcfConverter.writeDeviceInterfaces(deviceInterfaces);
        await fs.writeFile(ramlAndJson.raml, ramlAndJson.json, "utf8");
    }

    public static writeDeviceInterfaces(
            deviceInterfaces: DeviceInterface[]): { raml: string, json: string} {
        throw new Error("not implemented");
    }
}
