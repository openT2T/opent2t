
import { DeviceInterface, DeviceMethod, DeviceParameter, DeviceProperty } from "./DeviceInterface";
import { IDeviceInterfaceConverter } from "./IDeviceInterfaceConverter";
import { Schema } from "jsonschema";
import { Builder, Parser } from "xml2js";

import * as fs from "fs";

/**
 * Reads and writes device interface specifications in AllJoyn XML format.
 */
export class AllJoynConverter implements IDeviceInterfaceConverter {
    public async readAsync(sourceFilePath: string): Promise<DeviceInterface> {
        let xmlString = await new Promise<string>((resolve, reject) => {
            fs.readFile(sourceFilePath, "utf8", (err: Error, data: string) => {
                err ? reject(err) : resolve(data);
            });
        });
        let xmlDoc = await new Promise<any>((resolve, reject) => {
            new Parser({}).parseString(xmlString, (err: Error, xml: any) => {
                err ? reject(err) : resolve(xml);
            });
        });
        if (!xmlDoc.node || !xmlDoc.node.interface) {
            throw new Error("Missing /node/interface element.");
        }

        return this.parseAllJoynInterface(xmlDoc.node.interface[0]);
    }

    public writeAsync(deviceInterface: DeviceInterface, targetDirectoryPath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            reject(new Error("not implemented"));
        });
    }

    private parseAllJoynInterface(interfaceElement: any): DeviceInterface {
        let interfaceName: string = this.getRequiredAttribute(
                interfaceElement, "name", "/node/interface");

        let properties: DeviceProperty[] = [];
        let methods: DeviceMethod[] = [];

        if (Array.isArray(interfaceElement.property)) {
            interfaceElement.property.forEach((propertyElement: any) => {
                this.mergeProperty(properties, this.parseAllJoynProperty(propertyElement));
            });
        }

        if (Array.isArray(interfaceElement.signal)) {
            interfaceElement.signal.forEach((signalElement: any) => {
                this.mergeProperty(properties, this.parseAllJoynSignal(signalElement));
            });
        }

        if (Array.isArray(interfaceElement.method)) {
            interfaceElement.method.forEach((methodElement: any) => {
                methods.push(this.parseAllJoynMethod(methodElement));
            });
        }

        return {
            description: this.getOptionalElement(interfaceElement, "description"),
            methods: methods,
            name: interfaceName,
            properties: properties,
            version: "",
        };
    }

    private parseAllJoynProperty(propertyElement: any): DeviceProperty {
        let propertyName: string = this.getRequiredAttribute(
                propertyElement, "name", "/node/interface/property");
        let propertyAccess: string = this.getRequiredAttribute(
                propertyElement, "access", "/node/interface/property");
        let propertyType: string = this.getRequiredAttribute(
                propertyElement, "type", "/node/interface/property");

        return {
            canNotify: false,
            canRead: (propertyAccess === "read" || propertyAccess === "readwrite"),
            canWrite: (propertyAccess === "write" || propertyAccess === "readwrite"),
            description: this.getOptionalElement(propertyElement, "description"),
            name: propertyName,
            propertyType: this.allJoynTypeToJsonSchema(propertyType),
        };
    }

    private parseAllJoynSignal(signalElement: any): DeviceProperty {
        let signalName: string = this.getRequiredAttribute(
                signalElement, "name", "/node/interface/signal");

        let signalType: Schema | undefined;
        if (Array.isArray(signalElement.arg)) {
            signalElement.arg.forEach((argElement: any) => {
                let argType: string = this.getRequiredAttribute(
                        argElement, "type", "/node/interface/method/arg");
                let argDirection: string = this.getRequiredAttribute(
                        argElement, "direction", "/node/interface/method/arg");

                if (argDirection === "in") {
                    throw new Error("Signal in parameters are not supported.");

                } else if (argDirection === "out") {
                    if (signalType) {
                        throw new Error(
                                "Multiple signal out parameters are not supported.");
                    } else {
                        signalType = this.allJoynTypeToJsonSchema(argType);
                    }
                }
            });
        }

        if (typeof signalType === "undefined") {
            throw new Error("Missing out parameter for signal.");
        }

        return {
            canNotify: true,
            canRead: false,
            canWrite: false,
            description: this.getOptionalElement(signalElement, "description"),
            name: signalName,
            propertyType: signalType,
        };
    }

    private parseAllJoynMethod(methodElement: any): DeviceMethod {
        let methodName: string = this.getRequiredAttribute(
                methodElement, "name", "/node/interface/method");

        let parameters: DeviceParameter[] = [];
        if (Array.isArray(methodElement.arg)) {
            methodElement.arg.forEach((argElement: any) => {
                let argName: string = this.getRequiredAttribute(
                        argElement, "name", "/node/interface/method/arg");
                let argType: string = this.getRequiredAttribute(
                        argElement, "type", "/node/interface/method/arg");
                let argDirection: string = this.getRequiredAttribute(
                        argElement, "direction", "/node/interface/method/arg");

                parameters.push({
                    description: this.getOptionalElement(argElement, "description"),
                    isOut: (argDirection === "out"),
                    name: argName,
                    parameterType: this.allJoynTypeToJsonSchema(argType),
                });
            });
        }

        return {
            description: this.getOptionalElement(methodElement, "description"),
            name: methodName,
            parameters: parameters,
        };
    }

    private mergeProperty(properties: DeviceProperty[], property: DeviceProperty): void {
        let matchingProperty: DeviceProperty | undefined =
                properties.find(p => p.name === property.name);
        if (matchingProperty) {
            if (property.propertyType !== matchingProperty.propertyType) {
                throw new Error("Declarations for property '" + property.name + "' " +
                        "have inconsistent types.");
            }

            properties.push({
                canNotify: matchingProperty.canNotify || property.canNotify,
                canRead: matchingProperty.canRead || property.canRead,
                canWrite: matchingProperty.canWrite || property.canWrite,
                description: matchingProperty.description || property.description,
                name: matchingProperty.name,
                propertyType: matchingProperty.propertyType,
            });
        } else {
            properties.push(property);
        }
    }

    private getRequiredAttribute(
            xmlElement: any, attributeName: string, elementPath: string): string {
        let value: string = xmlElement.$ && xmlElement.$[attributeName];
        if (!value) {
            throw new Error("Missing " + elementPath + "/" + attributeName + " attribute.");
        }

        return value;
    }

    private getOptionalElement(xmlElement: any, elementName: string): string | undefined {
        if (Array.isArray(xmlElement[elementName]) && xmlElement[elementName].length > 0) {
            return xmlElement[elementName][0];
        }

        return undefined;
    }

    public allJoynTypeToJsonSchema(ajType: string): Schema {
        let firstChar: string = (ajType.length < 1 ? "" : ajType[0]);
        if (!firstChar) {
            throw new Error("Missing or invalid type");
        }

        let schemaType: string;
        let min: number | undefined;
        let max: number | undefined;
        switch (firstChar) {
            case "(":
                return this.allJoynStructTypeToJsonSchema(ajType);

            case "a":
                if (ajType.length > 1) {
                    if (ajType[1] === "{") {
                        return this.allJoynDictionaryTypeToJsonSchema(ajType);
                    } else {
                        return {
                            type: "array",
                            items: this.allJoynTypeToJsonSchema(ajType.substr(1)),
                        };
                    }
                } else {
                    throw new Error("Type not supported: " + ajType);
                }

            case "b": schemaType = "boolean"; break;
            case "d": schemaType = "number"; break; // double
            case "i": schemaType = "integer";
                min = -Math.pow(2, 31); max = Math.pow(2, 31) - 1; break; // int32
            case "n": schemaType = "integer";
                min = -Math.pow(2, 15); max = Math.pow(2, 15) - 1; break; // int16
            case "q": schemaType = "integer"; min = 0; max = Math.pow(2, 16); break; // uint16
            case "s": schemaType = "string"; break;
            case "t": schemaType = "integer"; min = 0; max = Math.pow(2, 64); break; // uint64
            case "u": schemaType = "integer"; min = 0; max = Math.pow(2, 32); break; // uint32
            case "x": schemaType = "integer";
                min = -Math.pow(2, 63); max = Math.pow(2, 63) - 1; break; // int64
            case "y": schemaType = "integer"; min = 0; max = Math.pow(2, 8); break; // uint8

            default: throw new Error("Type not supported: " + ajType);
        }

        return schemaType === "integer" ? {
            type: schemaType,
            minimum: min,
            maximum: max,
        } : {
            type: schemaType,
        };
    }

    private allJoynStructTypeToJsonSchema(ajType: string): Schema {
        if (!(ajType.startsWith("(") && ajType.endsWith(")"))) {
            throw new Error("Invalid struct type: " + ajType);
        }

        let properties: { [name: string]: Schema } = {};
        let i = 1;
        while (i < ajType.length - 1) {
            let memberPart: string | null = this.getAllJoynTypePart(
                    ajType.substr(i, ajType.length - 1 - i));
            if (!memberPart) {
                break;
            }

            let memberName = "_" + (i - 1);
            let memberSchema: Schema = this.allJoynTypeToJsonSchema(memberPart);
            properties[memberName] = memberSchema;
            i += memberPart.length;
        }

        return {
            type: "object",
            properties: properties,
        };
    }

    private allJoynDictionaryTypeToJsonSchema(ajType: string): Schema {
        if (!(ajType.startsWith("a{") && ajType.endsWith("}"))) {
            throw new Error("Invalid dictionary type: " + ajType);
        }

        let keyPart: string | null = this.getAllJoynTypePart(
                ajType.substr(2, ajType.length - 3));
        if (keyPart !== "s") {
            throw new Error("Dictionary key type not supported: " + keyPart + ". " +
                    "JavaScript dictionary keys must be strings.");
        }

        let valuePart: string | null = this.getAllJoynTypePart(
                ajType.substr(3, ajType.length - 4));
        if (!valuePart) {
            throw new Error("Dictionary value type missing: " + keyPart);
        }

        return {
            type: "object",
            additionalProperties: this.allJoynTypeToJsonSchema(valuePart),
        };
    }

    private getAllJoynTypePart(ajType: string): string | null {
        if (ajType.length < 1) {
            return null;
        }

        let ajTypePart: string;
        let firstChar: string = ajType[0];
        if (firstChar === "a") {
            ajTypePart = firstChar + this.getAllJoynTypePart(ajType.substr(1));
        } else if (firstChar === "(") {
            let parenCount: number = 1;
            let i = 1;
            while (parenCount > 0 && i < ajType.length) {
                parenCount += (ajType[i] === "(" ? 1 : ajType[i] === ")" ? -1 : 0);
                i++;
            }
            ajTypePart = ajType.substr(0, i);
        } else if (firstChar === "{") {
            let braceCount: number = 1;
            let i = 1;
            while (braceCount > 0 && i < ajType.length) {
                braceCount += (ajType[i] === "{" ? 1 : ajType[i] === "}" ? -1 : 0);
                i++;
            }
            ajTypePart = ajType.substr(0, i);
        } else {
            ajTypePart = firstChar;
        }

        return ajTypePart;
    }

    public jsonSchemaToAllJoynType(schema: Schema): string {
        throw new Error("Not implemented");
    }
}
