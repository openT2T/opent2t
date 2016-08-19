
import * as path from "path";
const $RefParser = require("json-schema-ref-parser");

/**
 * Describes the schema of JSON data.
 * Reference http://json-schema.org/ and
 * https://raw.githubusercontent.com/tdegrunt/jsonschema/master/lib/index.d.ts
 */
export interface JsonSchema {
    id?: string;
    $ref?: string;
    $schema?: string;
    title?: string;
    description?: string;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: boolean;
    minimum?: number;
    exclusiveMinimum?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    additionalItems?: boolean | JsonSchema;
    items?: JsonSchema | JsonSchema[];
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    additionalProperties?: boolean | JsonSchema;
    definitions?: { [name: string]: JsonSchema };
    properties?: { [name: string]: JsonSchema };
    patternProperties?: { [name: string]: JsonSchema };
    dependencies?: { [name: string]: JsonSchema | string[] };
    "enum"?: any[];
    type?: string | string[];
    allOf?: JsonSchema[];
    anyOf?: JsonSchema[];
    oneOf?: JsonSchema[];
    not?: JsonSchema;
}

/**
 * Methods for working with JSON schemas.
 *
 * (This class is intentionally given the same name as the interface.)
 */
export class JsonSchema {
    /**
     * Resolves "$ref" includes in a JSON schema.
     *
     * @param {JsonSchema} jsonSchema  Schema with "$ref" includes.
     * @param {(name: string) => Promise<string>} resolver  A callback function that takes
     *     the URI of a referenced file and asynchronously returns the contents of that file.
     * @returns {Promise<JsonSchema>}  Schema with references resolved.
     */
    public static async resolveReferencesAsync(
            jsonSchema: JsonSchema,
            fileResolver: (fileUri: string) => Promise<string>): Promise<JsonSchema> {
        const fileResolverAdapter = {
            canRead: /\.json$/i,
            read: function(file: { url: string, extension: string }): Promise<string> {
                // The dereferencer assumes paths are relative to the CWD.
                // But the resolver just expectes relative paths.
                // (The top schema is probably not in the CWD.)
                let relativeUri: string = path.relative(process.cwd(), file.url);
                return fileResolver(relativeUri);
            }
        };

        let dereferencedSchema: JsonSchema = await $RefParser.dereference(jsonSchema, {
            resolve: {
                file: fileResolverAdapter,
                http: false,
            },
            dereference: {
                circular: "ignore",
            }
        });
        return dereferencedSchema;
    }
}
