
import { DeviceInterface, DeviceMethod, DeviceParameter, DeviceProperty } from "../DeviceInterface";
import { Schema } from "jsonschema";
import { Builder, Parser } from "xml2js";

import * as fs from "mz/fs";

/**
 * Reads and writes device interface specifications in AllJoyn XML format.
 * Reference https://wiki.allseenalliance.org/irb/extended_introspection_xml
 */
export class AllJoynConverter {

    /**
     * Reads device interfaces from an AllJoyn schema XML file.
     *
     * @param {string} filePath  Path to the source XML file
     * @returns {Promise<DeviceInterface[]>} One or more interfaces parsed from the file
     */
    public static async readDeviceInterfacesFromFileAsync(filePath: string): Promise<DeviceInterface[]> {
        let allJoynXml = await fs.readFile(filePath, "utf8");
        return await AllJoynConverter.readDeviceInterfacesAsync(allJoynXml);
    }

    /**
     * Reads device interfaces from an AllJoyn schema XML string.
     *
     * @param {string} allJoynXml  Schema XML contents
     * @returns {Promise<DeviceInterface[]>} One or more interfaces parsed from the XML
     */
    public static async readDeviceInterfacesAsync(allJoynXml: string): Promise<DeviceInterface[]> {
        let xmlDoc = await new Promise<any>((resolve, reject) => {
            new Parser({}).parseString(allJoynXml, (err: Error, xml: any) => {
                err ? reject(err) : resolve(xml);
            });
        });
        if (!xmlDoc.node || !xmlDoc.node.interface) {
            throw new Error("Missing /node/interface element(s).");
        }

        // xmlDoc.node.interface is an array of 1 or more <interface> elements.
        return xmlDoc.node.interface.map((interfaceElement: any) => {
            return AllJoynConverter.parseAllJoynInterface(interfaceElement);
        });
    }

    /**
     * Writes device interfaces to an AllJoyn schema XML file.
     *
     * @param {DeviceInterface[]} deviceInterfaces  One or more interfaces to write
     * @param {string} filePath Path to the target XML file
     */
    public static async writeDeviceInterfacesToFileAsync(
            deviceInterfaces: DeviceInterface[], filePath: string): Promise<void> {
        let allJoynXml: string = await AllJoynConverter.writeDeviceInterfacesAsync(deviceInterfaces);
        await fs.writeFile(filePath, allJoynXml, "utf8");
    }

    /**
     * Writes device interfaces to an AllJoyn schema XML string.
     *
     * @param {DeviceInterface[]} deviceInterfaces  One or more interfaces to write
     * @returns {Promise<string>} AllJoyn schema XML contents
     */
    public static writeDeviceInterfacesAsync(deviceInterfaces: DeviceInterface[]): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let xmlBuilder: Builder = new Builder({ doctype: AllJoynConverter.doctype });
            resolve(xmlBuilder.buildObject({
                node: {
                    interface: deviceInterfaces.map(AllJoynConverter.writeAllJoynInterface),
                },
            }));
        });
    }

    /**
     * Converts an AllJoyn type code (as found in the type attribute of an element) to a JSON schema.
     *
     * @param {string} ajType  AllJoyn type code
     * @param {{[name: string]: Schema}} [namedTypes]  Optional mapping from type names to schemas
     *     for named types loaded from <struct> or <dict> elements within the same XML document
     * @returns {Schema} JSON schema
     */
    public static allJoynTypeToJsonSchema(
            ajType: string, namedTypes?: {[name: string]: Schema}): Schema {
        let firstChar: string = (ajType.length < 1 ? "" : ajType[0]);
        if (!firstChar) {
            throw new Error("Missing or invalid type");
        }

        let schemaType: string;
        let min: number | undefined;
        let max: number | undefined;
        switch (firstChar) {
            case "[":
                throw new Error("Named types are not implemented.");

            case "(":
                return AllJoynConverter.allJoynStructTypeToJsonSchema(ajType);

            case "a":
                if (ajType.length > 1) {
                    if (ajType[1] === "{") {
                        return AllJoynConverter.allJoynDictionaryTypeToJsonSchema(ajType);
                    } else {
                        return {
                            items: AllJoynConverter.allJoynTypeToJsonSchema(
                                    ajType.substr(1), namedTypes),
                            type: "array",
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
            maximum: max,
            minimum: min,
            type: schemaType,
        } : {
            type: schemaType,
        };
    }

    /**
     * Converts a JSON schema to an AllJoyn type code, while extracting any included
     * named types.
     *
     * @param {Schema} schema  JSON schema to be converted
     * @param {{[name: string]: Schema}} [namedTypes]  Optional mapping from type names to
     *     schemas for named types, that is filled in by named types in the converted schema.
     * @returns {string}
     */
    public static jsonSchemaToAllJoynType(
            schema: Schema, namedTypes?: {[name: string]: Schema}): string {
        if (!schema.type) {
            throw new Error("A type property is required in the schema.");
        }

        if (schema.title) {
            // The title property will be used to enable round-tripping of named types
            // specified as separate <struct> or <dict> elements in an AllJoyn schema.
            throw new Error("Named types are not implemented.");
        }

        switch (schema.type) {
            case "boolean": return "b";
            case "string": return "s";
            case "number": return "d"; // double
            case "integer":
                let min = schema.minimum;
                let max = schema.maximum;
                if (typeof min === "number" || typeof max === "number") {
                    // Determine the kind of integer based on the min/max values.
                    if (min === 0) {
                        if (max === Math.pow(2, 8)) {
                            return "y"; // uint8
                        } else if (max === Math.pow(2, 16)) {
                            return "q"; // uint16
                        } else if (max === Math.pow(2, 32)) {
                            return "u"; // uint32
                        } else if (max === Math.pow(2, 64)) {
                            return "t"; // uint64
                        }
                    } else if (min < 0) {
                        if (min === -Math.pow(2, 15) && max === Math.pow(2, 15) - 1) {
                            return "n"; // int16
                        } else if (min === -Math.pow(2, 31) && max === Math.pow(2, 31) - 1) {
                            return "i"; // int32
                        } else if (min === -Math.pow(2, 63) && max === Math.pow(2, 63) - 1) {
                            return "x"; // int64
                        }
                    }
                    throw new Error("Unsupported integer min/max values: " + min + "/" + max);
                } else {
                    // Default to int32 when no min/max was specified.
                    return "i";
                }
            case "object":
                if (typeof schema.additionalProperties === "object") {
                    // Dictionary: the additionalProperties object specifies the value type.
                    // The key type for JavaScript dictionaries is always string.
                    let valueType = AllJoynConverter.jsonSchemaToAllJoynType(schema.additionalProperties);
                    return "a{s" + valueType + "}";
                } else {
                    throw new Error("Non-dictionary object types are not implemented.");
                }
            case "array":
                if (Array.isArray(schema.items)) {
                    // Anonymous struct: each item in the items array specifies a struct member type.
                    let structTypes = schema.items.map((itemType: Schema) => {
                        return AllJoynConverter.jsonSchemaToAllJoynType(itemType, namedTypes);
                    }).join("");
                    return "(" + structTypes + ")";
                } else if (typeof schema.items === "object") {
                    // Variable-length array: the items object specifies the array element type.
                    return "a" + AllJoynConverter.jsonSchemaToAllJoynType(schema.items);
                } else {
                    throw new Error("An items property is required in the array schema.");
                }
            default:
                throw new Error("Unsupported JSON schema type: " + schema.type);
        }
    }

    private static doctype = {
        pubID: "-//freedesktop//DTD D-BUS Object Introspection 1.0//EN",
        sysID: "http://standards.freedesktop.org/dbus/introspect-1.0.dtd",
    };

    private static braces = [["[", "(", "{"], ["]", ")", "}"]];

    private static parseAllJoynInterface(interfaceElement: any): DeviceInterface {
        let interfaceName: string = AllJoynConverter.getRequiredAttribute(
                interfaceElement, "name", "/node/interface");

        let properties: DeviceProperty[] = [];
        let methods: DeviceMethod[] = [];

        if (Array.isArray(interfaceElement.property)) {
            interfaceElement.property.forEach((propertyElement: any) => {
                AllJoynConverter.mergeProperty(properties,
                        AllJoynConverter.parseAllJoynProperty(propertyElement, interfaceName));
            });
        }

        if (Array.isArray(interfaceElement.signal)) {
            interfaceElement.signal.forEach((signalElement: any) => {
                AllJoynConverter.mergeProperty(properties,
                        AllJoynConverter.parseAllJoynSignal(signalElement, interfaceName));
            });
        }

        if (Array.isArray(interfaceElement.method)) {
            interfaceElement.method.forEach((methodElement: any) => {
                methods.push(AllJoynConverter.parseAllJoynMethod(methodElement, interfaceName));
            });
        }

        return {
            description: AllJoynConverter.getOptionalElement(interfaceElement, "description"),
            methods: methods,
            name: interfaceName,
            properties: properties,
            references: [],
        };
    }

    private static parseAllJoynProperty(propertyElement: any, interfaceName: string): DeviceProperty {
        let propertyName: string = AllJoynConverter.getRequiredAttribute(
                propertyElement, "name", "/node/interface/property");
        let propertyAccess: string = AllJoynConverter.getRequiredAttribute(
                propertyElement, "access", "/node/interface/property");
        let propertyType: string = AllJoynConverter.getRequiredAttribute(
                propertyElement, "type", "/node/interface/property");

        return {
            canNotify: false,
            canRead: (propertyAccess === "read" || propertyAccess === "readwrite"),
            canWrite: (propertyAccess === "write" || propertyAccess === "readwrite"),
            description: AllJoynConverter.getOptionalElement(propertyElement, "description"),
            interfaceName: interfaceName,
            name: propertyName,
            propertyType: AllJoynConverter.allJoynTypeToJsonSchema(propertyType),
        };
    }

    private static parseAllJoynSignal(signalElement: any, interfaceName: string): DeviceProperty {
        let signalName: string = AllJoynConverter.getRequiredAttribute(
                signalElement, "name", "/node/interface/signal");

        let signalType: Schema | undefined;
        if (Array.isArray(signalElement.arg)) {
            signalElement.arg.forEach((argElement: any) => {
                let argType: string = AllJoynConverter.getRequiredAttribute(
                        argElement, "type", "/node/interface/method/arg");
                let argDirection: string = AllJoynConverter.getRequiredAttribute(
                        argElement, "direction", "/node/interface/method/arg");

                if (argDirection === "in") {
                    throw new Error("Signal in parameters are not supported.");

                } else if (argDirection === "out") {
                    if (signalType) {
                        throw new Error(
                                "Multiple signal out parameters are not supported.");
                    } else {
                        signalType = AllJoynConverter.allJoynTypeToJsonSchema(argType);
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
            description: AllJoynConverter.getOptionalElement(signalElement, "description"),
            interfaceName: interfaceName,
            name: signalName,
            propertyType: signalType,
        };
    }

    private static parseAllJoynMethod(methodElement: any, interfaceName: string): DeviceMethod {
        let methodName: string = AllJoynConverter.getRequiredAttribute(
                methodElement, "name", "/node/interface/method");

        let parameters: DeviceParameter[] = [];
        if (Array.isArray(methodElement.arg)) {
            methodElement.arg.forEach((argElement: any) => {
                let argName: string = AllJoynConverter.getRequiredAttribute(
                        argElement, "name", "/node/interface/method/arg");
                let argType: string = AllJoynConverter.getRequiredAttribute(
                        argElement, "type", "/node/interface/method/arg");
                let argDirection: string = AllJoynConverter.getRequiredAttribute(
                        argElement, "direction", "/node/interface/method/arg");

                parameters.push({
                    description: AllJoynConverter.getOptionalElement(argElement, "description"),
                    isOut: (argDirection === "out"),
                    name: argName,
                    parameterType: AllJoynConverter.allJoynTypeToJsonSchema(argType),
                });
            });
        }

        return {
            description: AllJoynConverter.getOptionalElement(methodElement, "description"),
            interfaceName: interfaceName,
            name: methodName,
            parameters: parameters,
        };
    }

    private static mergeProperty(properties: DeviceProperty[], property: DeviceProperty): void {
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
                interfaceName: matchingProperty.interfaceName,
                name: matchingProperty.name,
                propertyType: matchingProperty.propertyType,
            });
        } else {
            properties.push(property);
        }
    }

    private static getRequiredAttribute(
            xmlElement: any, attributeName: string, elementPath: string): string {
        let value: string = xmlElement.$ && xmlElement.$[attributeName];
        if (!value) {
            throw new Error("Missing " + elementPath + "/" + attributeName + " attribute.");
        }

        return value;
    }

    private static getOptionalElement(xmlElement: any, elementName: string): string | undefined {
        if (Array.isArray(xmlElement[elementName]) && xmlElement[elementName].length > 0) {
            return xmlElement[elementName][0];
        }

        return undefined;
    }

    private static allJoynStructTypeToJsonSchema(ajType: string): Schema {
        if (!(ajType.startsWith("(") && ajType.endsWith(")"))) {
            throw new Error("Invalid struct type: " + ajType);
        }

        // AllJoyn anonymous structures are represented in JSON schema syntax as fixed-length arrays.
        // Each item in the members array is a JSON schema for the struct member at that index.
        let members: Schema[] = [];
        let i = 1;
        while (i < ajType.length - 1) {
            let memberPart: string | null = AllJoynConverter.getAllJoynTypePart(
                    ajType.substr(i, ajType.length - 1 - i));
            if (!memberPart) {
                break;
            }

            let memberSchema: Schema = AllJoynConverter.allJoynTypeToJsonSchema(memberPart);
            members.push(memberSchema);
            i += memberPart.length;
        }

        return {
            items: members,
            type: "array",
        };
    }

    private static allJoynDictionaryTypeToJsonSchema(ajType: string): Schema {
        if (!(ajType.startsWith("a{") && ajType.endsWith("}"))) {
            throw new Error("Invalid dictionary type: " + ajType);
        }

        let keyPart: string | null = AllJoynConverter.getAllJoynTypePart(
                ajType.substr(2, ajType.length - 3));
        if (keyPart !== "s") {
            throw new Error("Dictionary key type not supported: " + keyPart + ". " +
                    "JavaScript dictionary keys must be strings.");
        }

        let valuePart: string | null = AllJoynConverter.getAllJoynTypePart(
                ajType.substr(3, ajType.length - 4));
        if (!valuePart) {
            throw new Error("Dictionary value type missing: " + keyPart);
        }

        return {
            additionalProperties: AllJoynConverter.allJoynTypeToJsonSchema(valuePart),
            type: "object",
        };
    }

    private static getAllJoynTypePart(ajType: string): string | null {
        if (ajType.length < 1) {
            return null;
        }

        let ajTypePart: string;
        let firstChar: string = ajType[0];
        let braceIndex: number = AllJoynConverter.braces[0].indexOf(firstChar);

        if (braceIndex >= 0) {
            let matchChar: string = AllJoynConverter.braces[1][braceIndex];
            let braceCount: number = 1;
            let i: number = 1;
            while (braceCount > 0 && i < ajType.length) {
                braceCount += (ajType[i] === firstChar ? 1 : ajType[i] === matchChar ? -1 : 0);
                i++;
            }
            ajTypePart = ajType.substr(0, i);
        } else if (firstChar === "a") {
            ajTypePart = firstChar + AllJoynConverter.getAllJoynTypePart(ajType.substr(1));
        } else {
            ajTypePart = firstChar;
        }

        return ajTypePart;
    }

    private static writeAllJoynInterface(deviceInterface: DeviceInterface): any {
        let interfaceElement: any = {
            $: {
                name: deviceInterface.name,
            },
            method: deviceInterface.methods.map((deviceMethod: DeviceMethod) => {
                let methodElement: any = {
                    $: {
                        name: deviceMethod.name,
                    },
                    arg: deviceMethod.parameters.map((deviceParameter: DeviceParameter) => {
                        let argElement: any = {
                            $: {
                                direction: (deviceParameter.isOut ? "out" : "in"),
                                name: deviceParameter.name,
                                type: AllJoynConverter.jsonSchemaToAllJoynType(deviceParameter.parameterType),
                            },
                        };
                        if (deviceParameter.description) {
                            argElement.description = deviceParameter.description;
                        }
                        return argElement;
                    }),
                };
                if (deviceMethod.description) {
                    methodElement.description = deviceMethod.description;
                }
                return methodElement;
            }),
            property: deviceInterface.properties
                .filter((deviceProperty: DeviceProperty) => deviceProperty.canRead || deviceProperty.canWrite)
                .map((deviceProperty: DeviceProperty) => {
                    let propertyElement: any = {
                        $: {
                            access: (deviceProperty.canWrite ? "readwrite" : "read"),
                            name: deviceProperty.name,
                            type: AllJoynConverter.jsonSchemaToAllJoynType(deviceProperty.propertyType),
                        },
                    };
                    if (deviceProperty.description) {
                        propertyElement.description = deviceProperty.description;
                    }
                    return propertyElement;
                }),
            signal: deviceInterface.properties
                .filter((deviceProperty: DeviceProperty) => deviceProperty.canNotify)
                .map((deviceProperty: DeviceProperty) => {
                    let signalElement: any = {
                        $: {
                            name: deviceProperty.name,
                        },
                        arg: [
                            {
                                $: {
                                    direction: "out",
                                    name: deviceProperty.name,
                                    type: AllJoynConverter.jsonSchemaToAllJoynType(deviceProperty.propertyType),
                                },
                            },
                        ],
                        description: deviceProperty.description,
                    };
                    if (deviceProperty.description) {
                        signalElement.description = deviceProperty.description;
                    }
                    return signalElement;
                }),
        };
        if (deviceInterface.description) {
            interfaceElement.description = deviceInterface.description;
        }
        return interfaceElement;
    }
}
