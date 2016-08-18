
import {
    JsonSchema,
    ThingMethod,
    ThingParameter,
    ThingProperty,
    ThingSchema,
} from "../ThingSchema";
import { Builder } from "xml2js";

import * as fs from "mz/fs";

export = AllJoynSchemaWriter;

/**
 * Writes thing schema specifications in AllJoyn XML format.
 * Reference https://wiki.allseenalliance.org/irb/extended_introspection_xml
 */
class AllJoynSchemaWriter {
    /**
     * Writes thing schemas to an AllJoyn schema XML file asynchronously.
     *
     * @param {ThingSchema[]} deviceInterfaces  One or more schemas to write
     * @param {string} filePath Path to the target XML file
     */
    public static async writeThingSchemasToFileAsync(
            deviceInterfaces: ThingSchema[], filePath: string): Promise<void> {
        let allJoynXml: string = AllJoynSchemaWriter.writeThingSchemas(deviceInterfaces);
        await fs.writeFile(filePath, allJoynXml, "utf8");
    }

    /**
     * Writes thing schemas to an AllJoyn schema XML string.
     *
     * @param {ThingSchema[]} deviceInterfaces  One or more schemas to write
     * @returns {string} AllJoyn schema XML contents
     */
    public static writeThingSchemas(deviceInterfaces: ThingSchema[]): string {
        let xmlBuilder: Builder = new Builder({
            doctype: AllJoynSchemaWriter.doctype,
        });

        return xmlBuilder.buildObject({
            node: {
                interface: deviceInterfaces.map(AllJoynSchemaWriter.writeAllJoynInterface),
            },
        });
    }

    /**
     * Converts a JSON schema to an AllJoyn type code, while extracting any included
     * named types.
     *
     * @param {JsonSchema} schema  JSON schema to be converted
     * @param {{[name: string]: JsonSchema}} [namedTypes]  Optional mapping from type names to
     *     schemas for named types, that is filled in by named types in the converted schema.
     * @returns {string}
     */
    public static jsonSchemaToAllJoynType(
            schema: JsonSchema, namedTypes?: {[name: string]: JsonSchema}): string {
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
                    let valueType = AllJoynSchemaWriter.jsonSchemaToAllJoynType(schema.additionalProperties);
                    return "a{s" + valueType + "}";
                } else {
                    throw new Error("Non-dictionary object types are not implemented.");
                }
            case "array":
                if (Array.isArray(schema.items)) {
                    // Anonymous struct: each item in the items array specifies a struct member type.
                    let structTypes = schema.items.map((itemType: JsonSchema) => {
                        return AllJoynSchemaWriter.jsonSchemaToAllJoynType(itemType, namedTypes);
                    }).join("");
                    return "(" + structTypes + ")";
                } else if (typeof schema.items === "object") {
                    // Variable-length array: the items object specifies the array element type.
                    return "a" + AllJoynSchemaWriter.jsonSchemaToAllJoynType(schema.items);
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

    private static writeAllJoynInterface(deviceInterface: ThingSchema): any {
        let interfaceElement: any = {
            $: {
                name: deviceInterface.name,
            },
            method: deviceInterface.methods.map((deviceMethod: ThingMethod) => {
                let methodElement: any = {
                    $: {
                        name: deviceMethod.name,
                    },
                    arg: deviceMethod.parameters.map((deviceParameter: ThingParameter) => {
                        let argElement: any = {
                            $: {
                                direction: (deviceParameter.isOut ? "out" : "in"),
                                name: deviceParameter.name,
                                type: AllJoynSchemaWriter.jsonSchemaToAllJoynType(deviceParameter.parameterType),
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
                .filter((deviceProperty: ThingProperty) => deviceProperty.canRead || deviceProperty.canWrite)
                .map((deviceProperty: ThingProperty) => {
                    let propertyElement: any = {
                        $: {
                            access: (deviceProperty.canWrite ? "readwrite" : "read"),
                            name: deviceProperty.name,
                            type: AllJoynSchemaWriter.jsonSchemaToAllJoynType(deviceProperty.propertyType),
                        },
                    };
                    if (deviceProperty.description) {
                        propertyElement.description = deviceProperty.description;
                    }
                    return propertyElement;
                }),
            signal: deviceInterface.properties
                .filter((deviceProperty: ThingProperty) => deviceProperty.canNotify)
                .map((deviceProperty: ThingProperty) => {
                    let signalElement: any = {
                        $: {
                            name: deviceProperty.name,
                        },
                        arg: [
                            {
                                $: {
                                    direction: "out",
                                    name: deviceProperty.name,
                                    type: AllJoynSchemaWriter.jsonSchemaToAllJoynType(deviceProperty.propertyType),
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
