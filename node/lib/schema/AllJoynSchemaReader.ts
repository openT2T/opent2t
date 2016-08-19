
import { JsonSchema } from "../JsonSchema";
import {
    ThingMethod,
    ThingParameter,
    ThingProperty,
    ThingSchema,
} from "../ThingSchema";
import { Parser } from "xml2js";

import * as fs from "mz/fs";

export = AllJoynSchemaReader;

/**
 * Reads thing schema specifications in AllJoyn XML format.
 * Reference https://wiki.allseenalliance.org/irb/extended_introspection_xml
 */
class AllJoynSchemaReader {
    /**
     * Reads thing schemas from an AllJoyn schema XML file.
     *
     * @param {string} filePath  Path to the source XML file
     * @returns {Promise<ThingSchema[]>} One or more schemas parsed from the file
     */
    public static async readThingSchemasFromFileAsync(filePath: string): Promise<ThingSchema[]> {
        let allJoynXml = await fs.readFile(filePath, "utf8");
        return AllJoynSchemaReader.readThingSchemas(allJoynXml);
    }

    /**
     * Reads thing schemas from an AllJoyn schema XML string.
     *
     * @param {string} allJoynXml  Schema XML contents
     * @returns {ThingSchema[]} One or more schemas parsed from the XML
     */
    public static readThingSchemas(allJoynXml: string): ThingSchema[] {
        let xmlDoc: any = null;

        new Parser({
            async: false,
        }).parseString(allJoynXml, (err: Error, xml: any) => {
            if (err) {
                throw err;
            }
            xmlDoc = xml;
        });

        if (!xmlDoc || !xmlDoc.node || !xmlDoc.node.interface) {
            throw new Error("Missing /node/interface element(s).");
        }

        // xmlDoc.node.interface is an array of 1 or more <interface> elements.
        return xmlDoc.node.interface.map((interfaceElement: any) => {
            return AllJoynSchemaReader.parseAllJoynInterface(interfaceElement);
        });
    }

    /**
     * Converts an AllJoyn type code (as found in the type attribute of an element) to a JSON schema.
     *
     * @param {string} ajType  AllJoyn type code
     * @param {{[name: string]: Schema}} [namedTypes]  Optional mapping from type names to schemas
     *     for named types loaded from <struct> or <dict> elements within the same XML document
     * @returns {JsonSchema} JSON schema
     */
    public static allJoynTypeToJsonSchema(
            ajType: string, namedTypes?: {[name: string]: JsonSchema}): JsonSchema {
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
                return AllJoynSchemaReader.allJoynStructTypeToJsonSchema(ajType);

            case "a":
                if (ajType.length > 1) {
                    if (ajType[1] === "{") {
                        return AllJoynSchemaReader.allJoynDictionaryTypeToJsonSchema(ajType);
                    } else {
                        return {
                            items: AllJoynSchemaReader.allJoynTypeToJsonSchema(
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

    private static braces = [["[", "(", "{"], ["]", ")", "}"]];

    private static parseAllJoynInterface(interfaceElement: any): ThingSchema {
        let schemaName: string = AllJoynSchemaReader.getRequiredAttribute(
                interfaceElement, "name", "/node/interface");

        let properties: ThingProperty[] = [];
        let methods: ThingMethod[] = [];

        if (Array.isArray(interfaceElement.property)) {
            interfaceElement.property.forEach((propertyElement: any) => {
                AllJoynSchemaReader.mergeProperty(properties,
                        AllJoynSchemaReader.parseAllJoynProperty(propertyElement, schemaName));
            });
        }

        if (Array.isArray(interfaceElement.signal)) {
            interfaceElement.signal.forEach((signalElement: any) => {
                AllJoynSchemaReader.mergeProperty(properties,
                        AllJoynSchemaReader.parseAllJoynSignal(signalElement, schemaName));
            });
        }

        if (Array.isArray(interfaceElement.method)) {
            interfaceElement.method.forEach((methodElement: any) => {
                methods.push(AllJoynSchemaReader.parseAllJoynMethod(methodElement, schemaName));
            });
        }

        return {
            description: AllJoynSchemaReader.getOptionalElement(interfaceElement, "description"),
            methods: methods,
            name: schemaName,
            properties: properties,
            references: [],
        };
    }

    private static parseAllJoynProperty(propertyElement: any, schemaName: string): ThingProperty {
        let propertyName: string = AllJoynSchemaReader.getRequiredAttribute(
                propertyElement, "name", "/node/interface/property");
        let propertyAccess: string = AllJoynSchemaReader.getRequiredAttribute(
                propertyElement, "access", "/node/interface/property");
        let propertyType: string = AllJoynSchemaReader.getRequiredAttribute(
                propertyElement, "type", "/node/interface/property");

        return {
            canNotify: false,
            canRead: (propertyAccess === "read" || propertyAccess === "readwrite"),
            canWrite: (propertyAccess === "write" || propertyAccess === "readwrite"),
            description: AllJoynSchemaReader.getOptionalElement(propertyElement, "description"),
            name: propertyName,
            propertyType: AllJoynSchemaReader.allJoynTypeToJsonSchema(propertyType),
            schemaName: schemaName,
        };
    }

    private static parseAllJoynSignal(signalElement: any, schemaName: string): ThingProperty {
        let signalName: string = AllJoynSchemaReader.getRequiredAttribute(
                signalElement, "name", "/node/interface/signal");

        let signalType: JsonSchema | undefined;
        if (Array.isArray(signalElement.arg)) {
            signalElement.arg.forEach((argElement: any) => {
                let argType: string = AllJoynSchemaReader.getRequiredAttribute(
                        argElement, "type", "/node/interface/method/arg");
                let argDirection: string = AllJoynSchemaReader.getRequiredAttribute(
                        argElement, "direction", "/node/interface/method/arg");

                if (argDirection === "in") {
                    throw new Error("Signal in parameters are not supported.");

                } else if (argDirection === "out") {
                    if (signalType) {
                        throw new Error(
                                "Multiple signal out parameters are not supported.");
                    } else {
                        signalType = AllJoynSchemaReader.allJoynTypeToJsonSchema(argType);
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
            description: AllJoynSchemaReader.getOptionalElement(signalElement, "description"),
            name: signalName,
            propertyType: signalType,
            schemaName: schemaName,
        };
    }

    private static parseAllJoynMethod(methodElement: any, schemaName: string): ThingMethod {
        let methodName: string = AllJoynSchemaReader.getRequiredAttribute(
                methodElement, "name", "/node/interface/method");

        let parameters: ThingParameter[] = [];
        if (Array.isArray(methodElement.arg)) {
            methodElement.arg.forEach((argElement: any) => {
                let argName: string = AllJoynSchemaReader.getRequiredAttribute(
                        argElement, "name", "/node/interface/method/arg");
                let argType: string = AllJoynSchemaReader.getRequiredAttribute(
                        argElement, "type", "/node/interface/method/arg");
                let argDirection: string = AllJoynSchemaReader.getRequiredAttribute(
                        argElement, "direction", "/node/interface/method/arg");

                parameters.push({
                    description: AllJoynSchemaReader.getOptionalElement(argElement, "description"),
                    isOut: (argDirection === "out"),
                    name: argName,
                    parameterType: AllJoynSchemaReader.allJoynTypeToJsonSchema(argType),
                });
            });
        }

        return {
            description: AllJoynSchemaReader.getOptionalElement(methodElement, "description"),
            name: methodName,
            parameters: parameters,
            schemaName: schemaName,
        };
    }

    private static mergeProperty(properties: ThingProperty[], property: ThingProperty): void {
        let matchingProperty: ThingProperty | undefined =
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
                schemaName: matchingProperty.schemaName,
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

    private static allJoynStructTypeToJsonSchema(ajType: string): JsonSchema {
        if (!(ajType.startsWith("(") && ajType.endsWith(")"))) {
            throw new Error("Invalid struct type: " + ajType);
        }

        // AllJoyn anonymous structures are represented in JSON schema syntax as fixed-length arrays.
        // Each item in the members array is a JSON schema for the struct member at that index.
        let members: JsonSchema[] = [];
        let i = 1;
        while (i < ajType.length - 1) {
            let memberPart: string | null = AllJoynSchemaReader.getAllJoynTypePart(
                    ajType.substr(i, ajType.length - 1 - i));
            if (!memberPart) {
                break;
            }

            let memberSchema: JsonSchema = AllJoynSchemaReader.allJoynTypeToJsonSchema(memberPart);
            members.push(memberSchema);
            i += memberPart.length;
        }

        return {
            items: members,
            type: "array",
        };
    }

    private static allJoynDictionaryTypeToJsonSchema(ajType: string): JsonSchema {
        if (!(ajType.startsWith("a{") && ajType.endsWith("}"))) {
            throw new Error("Invalid dictionary type: " + ajType);
        }

        let keyPart: string | null = AllJoynSchemaReader.getAllJoynTypePart(
                ajType.substr(2, ajType.length - 3));
        if (keyPart !== "s") {
            throw new Error("Dictionary key type not supported: " + keyPart + ". " +
                    "JavaScript dictionary keys must be strings.");
        }

        let valuePart: string | null = AllJoynSchemaReader.getAllJoynTypePart(
                ajType.substr(3, ajType.length - 4));
        if (!valuePart) {
            throw new Error("Dictionary value type missing: " + keyPart);
        }

        return {
            additionalProperties: AllJoynSchemaReader.allJoynTypeToJsonSchema(valuePart),
            type: "object",
        };
    }

    private static getAllJoynTypePart(ajType: string): string | null {
        if (ajType.length < 1) {
            return null;
        }

        let ajTypePart: string;
        let firstChar: string = ajType[0];
        let braceIndex: number = AllJoynSchemaReader.braces[0].indexOf(firstChar);

        if (braceIndex >= 0) {
            let matchChar: string = AllJoynSchemaReader.braces[1][braceIndex];
            let braceCount: number = 1;
            let i: number = 1;
            while (braceCount > 0 && i < ajType.length) {
                braceCount += (ajType[i] === firstChar ? 1 : ajType[i] === matchChar ? -1 : 0);
                i++;
            }
            ajTypePart = ajType.substr(0, i);
        } else if (firstChar === "a") {
            ajTypePart = firstChar + AllJoynSchemaReader.getAllJoynTypePart(ajType.substr(1));
        } else {
            ajTypePart = firstChar;
        }

        return ajTypePart;
    }
}
