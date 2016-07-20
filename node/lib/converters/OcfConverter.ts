
import { DeviceInterface, DeviceMethod, DeviceParameter, DeviceProperty } from "../DeviceInterface";
import { Schema } from "jsonschema";
import * as fs from "mz/fs";

/**
 * Reads and writes device interface specifications in OCF RAML+JSON format.
 */
export class OcfConverter {
    public static async readDeviceInterfacesFromFilesAsync(
            ramlFilePath: string, jsonFilePath: string): Promise<DeviceInterface[]> {
        let raml = await fs.readFile(ramlFilePath, "utf8");
        let json = await fs.readFile(jsonFilePath, "utf8");
        return await OcfConverter.readDeviceInterfacesAsync(raml, json);
    }

    public static async readDeviceInterfacesAsync(raml: string, json: string): Promise<DeviceInterface[]> {
        return new Promise<DeviceInterface[]>((resolve, reject) => {
            reject(new Error("not implemented"));
        });
    }

    public static async writeDeviceInterfacesToFileAsync(
            deviceInterfaces: DeviceInterface[], ramlFilePath: string, jsonFilePath: string): Promise<void> {
        let ramlAndJson: { raml: string, json: string} =
                await OcfConverter.writeDeviceInterfacesAsync(deviceInterfaces);
        await fs.writeFile(ramlAndJson.raml, ramlAndJson.json, "utf8");
    }

    public static writeDeviceInterfacesAsync(
            deviceInterfaces: DeviceInterface[]): Promise<{ raml: string, json: string}> {
        return new Promise<{ raml: string, json: string}>((resolve, reject) => {
            reject(new Error("not implemented"));
        });
    }
}
