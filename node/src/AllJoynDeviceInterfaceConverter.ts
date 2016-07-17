
import { DeviceInterface, DeviceMethod, DeviceProperty } from "./DeviceInterface";
import { IDeviceInterfaceConverter } from "./IDeviceInterfaceConverter";
import { Schema } from "jsonschema";
import { Builder, Parser } from "xml2js";

import * as fs from "fs";

/**
 * Reads and writes device interface specifications in AllJoyn XML format.
 */
export class AllJoynDeviceInterfaceConverter implements IDeviceInterfaceConverter {
    public readAsync(sourceFilePath: string): Promise<DeviceInterface> {
        return new Promise<DeviceInterface>((resolve, reject) => {
            fs.readFile(sourceFilePath, 'utf8', (err: Error, data: string) => {
                if (err) {
                    reject(err);
                } else {
                    new Parser({}).parseString(data, (err: Error, xml: any) => {
                        if (err) {
                            reject(err);
                        } else if (!xml.node || !xml.node.interface ||
                            !Array.isArray(xml.node.interface) ||
                            xml.node.interface.length != 1) {
                            reject(new Error("Missing /node/interface element."));
                        } else {
                            try {
                                resolve(this.parseAllJoynInterface(xml.node.interface[0]));
                            }
                            catch (parseError) {
                                reject(parseError);
                            }
                        }
                    });
                }
            });
        });
    }

    public writeAsync(deviceInterface: DeviceInterface, targetFilePath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            reject(new Error("not implemented"));
        });
    }

    private parseAllJoynInterface(interfaceElement: any): DeviceInterface {
console.dir(interfaceElement);
        let interfaceName: string = interfaceElement.$.name;
        if (!interfaceName) {
            throw new Error("Missing /node/interface/name attribute.");
        }

        let properties: DeviceProperty[] = [];
        let methods: DeviceMethod[] = [];

        if (Array.isArray(interfaceElement.property)) {
            interfaceElement.property.forEach((propertyElement: any) => {
                let propertyName: string = propertyElement.$.name;
                if (!propertyName) {
                    throw new Error("Missing /node/interface/property/name attribute.");
                }

                let propertyAccess: string = propertyElement.$.access;
                if (!propertyAccess) {
                    throw new Error("Missing /node/interface/property/access attribute.");
                }

                let propertyType: string = propertyElement.$.type;
                if (!propertyType) {
                    throw new Error("Missing /node/interface/property/type attribute.");
                }

                // TODO: Merge <property> and <signal> elements with the same name.
                properties.push({
                    name: propertyName,
                    description: this.getAllJoynElementDescription(propertyElement),
                    canRead: (propertyAccess == "read" || propertyAccess == "readwrite"),
                    canWrite: (propertyAccess == "write" || propertyAccess == "readwrite"),
                    canNotify: false,
                    propertyType: this.allJoynTypeToJsonSchema(propertyType),
                });
            });
        }

        if (Array.isArray(interfaceElement.method)) {
            interfaceElement.method.forEach((methodElement: any) => {
                let methodName: string = methodElement.$.name;
                if (!methodName) {
                    throw new Error("Missing /node/interface/method/name attribute.");
                }

                methods.push({
                    name: methodName,
                    description: this.getAllJoynElementDescription(methodElement),
                    parameters: [], // TODO: method parameters
                    result: null, // TODO: method result
                });
            });
        }

        if (Array.isArray(interfaceElement.signal)) {
            interfaceElement.signal.forEach((signalElement: any) => {
                let signalName: string = signalElement.$.name;
                if (!signalName) {
                    throw new Error("Missing /node/interface/signal/name attribute.");
                }

                // TODO: Merge <property> and <signal> elements with the same name.
                properties.push({
                    name: signalName,
                    description: this.getAllJoynElementDescription(signalElement),
                    canRead: false,
                    canWrite: false,
                    canNotify: true,
                    propertyType: {},
                });
            });
        }

        return {
            name: interfaceName,
            description: this.getAllJoynElementDescription(interfaceElement),
            version: "",
            properties: properties,
            methods: methods,
        };
    }

    private getAllJoynElementDescription(ajElement: any): string | undefined {
        if (Array.isArray(ajElement.description) && ajElement.description.length > 0) {
            return ajElement.description[0];
        }

        return undefined;
    }

    private allJoynTypeToJsonSchema(ajType: string): Schema {
        return {};
    }
}
