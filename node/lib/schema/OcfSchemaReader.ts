
import { JsonSchema } from "../JsonSchema";
import {
    ThingMethod,
    ThingParameter,
    ThingSchema,
} from "../ThingSchema";

import * as fs from "mz/fs";
import * as path from "path";
import * as raml from "raml-1-parser";

export = OcfSchemaReader;

/**
 * Reads thing schema specifications in OCF RAML+JSON format.
 */
class OcfSchemaReader {
    /**
     * Reads a thing schema from an OCF RAML file and supporting JSON files.
     *
     * @param {string} filePath  Path to the source RAML file
     * @returns {Promise<ThingSchema>} Schema parsed from the RAML and JSON files
     */
    public static async readThingSchemaFromFilesAsync(
            ramlFilePath: string): Promise<ThingSchema> {
        let ramlSchema: (raml.api08.Api | raml.api10.Api) = await raml.loadApi(ramlFilePath);
        let thingSchema: ThingSchema = OcfSchemaReader.ramlToThingSchema(ramlSchema);

        // The same JSON schemas will be referenced multiple times by a RAML file. So keep a
        // simple cache during the resolve operation to avoid reading files more than once.
        let resolveCache: { [ uri: string ]: string } = {};

        let schemaResolver: (fileName: string) => Promise<string> =
                OcfSchemaReader.resolveSchemaReferenceAsync.bind(
                    null, path.dirname(ramlFilePath), resolveCache);

        for (let methodIndex = 0; methodIndex < thingSchema.methods.length; methodIndex++) {
            let method = thingSchema.methods[methodIndex];
            for (let paramIndex = 0; paramIndex < method.parameters.length; paramIndex++) {
                let parameter = method.parameters[paramIndex];
                method.parameters[paramIndex] = {
                    isOut: parameter.isOut,
                    name: parameter.name,
                    parameterType: await JsonSchema.resolveReferencesAsync(
                        parameter.parameterType, schemaResolver),
                };
            }
        }

        return thingSchema;
    }

    /**
     * Reads a thing schema from an OCF RAML string and supporting JSON schema strings.
     *
     * @param {string} raml  RAML contents
     * @param {{[fileName: string]: string}} json  Map from JSON file names to JSON contents
     * @returns {ThingSchema} Schema parsed from the RAML and JSON strings
     */
    public static readThingSchema(
            raml: string, json: {[fileName: string]: string}): ThingSchema {
        // TODO: Call raml.parseRAMLSync() and pass in a resolver for JSON includes.
        throw new Error("not implemented");
    }

    /**
     * Convert a parsed RAML API to a thing schema.
     *
     * Note this code (mostly) supports RAML v0.8 and v1.0 APIs.
     * (OCF currently uses 0.8, so RAML 1.0 support is untested at this point.)
     */
    private static ramlToThingSchema(
            ramlSchema: (raml.api08.Api | raml.api10.Api)): ThingSchema {
        let schemaName = ramlSchema.title();
        let description: string | undefined;
        let methods: ThingMethod[] = [];

        let ramlResources: Array<raml.api08.Resource | raml.api10.Resource> =
                ramlSchema.resources();
        ramlResources.forEach(ramlResource => {
            // Remove a leading slash from the resource relative URI.
            // Replace any other slashes, dots, or dashes with underscores.
            let resourceName: string = ramlResource.relativeUri().value()
                    .replace(/^\//, "").replace(/[/.-]/g, "_");

            let resourceDescription: string = OcfSchemaReader.markdownToString(
                    ramlResource.description());

            // RAML doesn't have a top-level description, so use the description
            // of the first resource as the thing schema description.
            if (resourceDescription && !description) {
                description = resourceDescription;
            }

            let ramlResourceMethods: Array<raml.api08.Method | raml.api10.Method> =
                    ramlResource.methods();
            ramlResourceMethods.forEach(ramlResourceMethod => {
                let verb: string = ramlResourceMethod.method();
                let methodDescription: string = OcfSchemaReader.markdownToString(
                        ramlResourceMethod.description());

                // Derive a JavaScript method name from the verb and resource name (URI).
                let methodName: string = verb + OcfSchemaReader.capitalize(resourceName);

                // Parameters are fixed, depending on the verb.
                // Get the parameter types (JSON schemas) that are specified in the RAML.
                let methodParameters: ThingParameter[] = [];
                if (verb === "get") {
                    let responseSchema: JsonSchema =
                            OcfSchemaReader.getResourceMethodResponseSchema(
                                ramlSchema.schemas(), resourceName, ramlResourceMethod);
                    methodParameters.push({
                        isOut: true,
                        name: "result",
                        parameterType: responseSchema,
                    });
                } else if (verb === "post") {
                    let requestSchema: JsonSchema =
                            OcfSchemaReader.getResourceMethodRequestSchema(
                                ramlSchema.schemas(), resourceName, ramlResourceMethod);
                    methodParameters.push({
                        isOut: false,
                        name: "value",
                        parameterType: requestSchema,
                    });
                    let responseSchema: JsonSchema =
                            OcfSchemaReader.getResourceMethodResponseSchema(
                                ramlSchema.schemas(), resourceName, ramlResourceMethod);
                    methodParameters.push({
                        isOut: true,
                        name: "result",
                        parameterType: responseSchema,
                    });
                } else {
                    console.warn("Ignoring unsupported verb '" + verb + "' for resource '" +
                            resourceName + "' in schema '" + schemaName + "'");
                }

                methods.push({
                    description: methodDescription,
                    name: methodName,
                    parameters: methodParameters,
                    schemaName: schemaName,
                });
            });
        });

        return {
            description: description,
            methods: methods,
            name: schemaName,
            properties: [],
            references: [],
        };
    }

    /**
     * Get the JSON schema for a RAML resource method's request body.
     */
    private static getResourceMethodRequestSchema(
            ramlSchemas: Array<raml.api08.GlobalSchema | raml.api10.TypeDeclaration>,
            resourceName: string,
            ramlResourceMethod: raml.api08.Method | raml.api10.Method): JsonSchema {
        let requestBodies: Array<raml.api08.BodyLike | raml.api10.TypeDeclaration> =
                ramlResourceMethod.body();
        if (requestBodies.length !== 1) {
            // TODO: Look for one body that has content-type application/json?
            throw new Error(
                    (requestBodies.length === 0 ?
                        "No request body" : "Multiple request bodies") +
                    " found for method '" + ramlResourceMethod.method() +
                    "' on resource '" + resourceName + "'");
        }

        let bodySchema: raml.api08.SchemaString | string[] = requestBodies[0].schema();
        let schemaName: string;
        if (!bodySchema) {
            throw new Error(
                    "No request body schema found for method '" + ramlResourceMethod.method() +
                    "' on resource '" + resourceName + "'");
        } else if (Array.isArray(bodySchema)) {
            if (bodySchema.length !== 1) {
                throw new Error(
                        (bodySchema.length === 0 ?
                            "No request body schema" : "Multiple request body schemas") +
                        " found for method '" + ramlResourceMethod.method() +
                        "' on resource '" + resourceName + "'");
            }

            schemaName = bodySchema[0];
        } else {
            schemaName = bodySchema.value();
        }

        try {
            return OcfSchemaReader.getJsonSchema(ramlSchemas, schemaName);
        } catch (error) {
            throw new Error(
                    "Failed to get request body schema for method '" +
                    ramlResourceMethod.method() + "' on resource '" + resourceName +
                    "': " + error.message);
        }
    }

    /**
     * Get the JSON schema for a RAML resource method's response body.
     * The RAML may define different schemas for different response status codes;
     * for now we're only looking for a success (200) response code.
     */
    private static getResourceMethodResponseSchema(
            ramlSchemas: Array<raml.api08.GlobalSchema | raml.api10.TypeDeclaration>,
            resourceName: string,
            ramlResourceMethod: raml.api08.Method | raml.api10.Method,
            responseCode?: string): JsonSchema {
        let matchCode: string = responseCode || "200";

        let ramlResponses: Array<raml.api08.Response | raml.api10.Response> =
                    ramlResourceMethod.responses();
        let ramlResponse: raml.api08.Response | raml.api10.Response | undefined =
                ramlResponses.find(r => r.code().value() === matchCode);

        if (!ramlResponse) {
            throw new Error("Response not found with code " + matchCode + " for method '" +
                    ramlResourceMethod.method() + "' on resource '" + resourceName + "'");
        }

        let responseBodies: Array<raml.api08.BodyLike | raml.api10.TypeDeclaration> =
                ramlResponse.body();
        if (responseBodies.length !== 1) {
            // TODO: Look for one body that has content-type application/json?
            throw new Error(
                    (responseBodies.length === 0 ?
                        "No response body" : "Multiple response bodies") +
                    " found for response code " + matchCode + " for method '" +
                    ramlResourceMethod.method() + "' on resource '" + resourceName + "'");
        }

        let bodySchema: raml.api08.SchemaString | string[] = responseBodies[0].schema();
        let schemaName: string;
        if (!bodySchema) {
            throw new Error(
                    "No response body schema found for response code " + matchCode +
                    " for method '" + ramlResourceMethod.method() + "' on resource '" +
                    resourceName + "'");
        } else if (Array.isArray(bodySchema)) {
            if (bodySchema.length !== 1) {
                throw new Error(
                        (bodySchema.length === 0 ?
                            "No response body schema" : "Multiple response body schemas") +
                        " found for response code " + matchCode + " for method '" +
                        ramlResourceMethod.method() + "' on resource '" + resourceName + "'");
            }

            schemaName = bodySchema[0];
        } else {
            schemaName = bodySchema.value();
        }

        try {
            return OcfSchemaReader.getJsonSchema(ramlSchemas, schemaName);
        } catch (error) {
            throw new Error(
                    "Failed to get response body schema for response code " + matchCode +
                    " for method '" + ramlResourceMethod.method() + "' on resource '" +
                    resourceName + "': " + error.message);
        }
    }

    /**
     * Given a schema name, look it up in the RAML's global schema declarations,
     * and parse the string as JSON.
     */
    private static getJsonSchema(
            ramlSchemas: Array<raml.api08.GlobalSchema | raml.api10.TypeDeclaration>,
            schemaName: string): JsonSchema {
        let ramlSchema: raml.api08.GlobalSchema | raml.api10.TypeDeclaration | undefined =
            ramlSchemas.find(s => {
                return ((<raml.api08.GlobalSchema> s).key &&
                        (<raml.api08.GlobalSchema> s).key() === schemaName) ||
                       ((<raml.api10.TypeDeclaration> s).name &&
                        ((<raml.api10.TypeDeclaration> s).name()) === schemaName);
            });
        if (!ramlSchema) {
            throw new Error("Schema declaration not found: '" + schemaName + "'");
        }

        // TODO: Support RAML 1.0 schema declarations.
        let jsonSchemaString: string | null = ((<raml.api08.GlobalSchema> ramlSchema).value ?
                (<raml.api08.GlobalSchema> ramlSchema).value().value() : null);
        if (!jsonSchemaString) {
            throw new Error("Schema not specified: '" + schemaName + "'");
        }

        let jsonSchema: JsonSchema;
        try {
            jsonSchema = JSON.parse(jsonSchemaString);
        } catch (error) {
            throw new Error("Failed to parse JSON schema '" + schemaName +
                    "': " + error.message);
        }

        return jsonSchema;
    }

    private static markdownToString(markdownString: raml.api08.MarkdownString): string {
        if (markdownString) {
            return markdownString.value().trim();
        } else {
            return "";
        }
    }

    private static capitalize(propertyName: string) {
        if (propertyName.length > 1) {
            return propertyName[0].toUpperCase() + propertyName.substr(1);
        }

        return propertyName;
    }

    /**
     * Look for a referenced JSON schema file in the same directory as the RAML file or
     * in a sibling directory having the same base name as the file. Used with
     * JsonSchema.resolveReferencesAsync().
     */
    private static async resolveSchemaReferenceAsync(
            ramlDirectory: string,
            resolveCache: { [ uri: string ]: string },
            fileUri: string): Promise<string> {
        let contents: string = resolveCache[fileUri];

        if (typeof contents !== "string") {
            let filePath: string = path.join(ramlDirectory, fileUri);
            if (!(await fs.exists(filePath))) {
                filePath = path.join(
                        ramlDirectory, "..", path.basename(fileUri, ".json"), fileUri);
                if (!(await fs.exists(filePath))) {
                    throw new Error("JSON schema file not found: " + fileUri);
                }
            }
            contents = await fs.readFile(filePath, "utf8");
            resolveCache[fileUri] = contents;
        }

        return contents;
    }
}
