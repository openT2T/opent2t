
/**
 * Describes the schema of JSON data.
 * Reference http://json-schema.org/ and
 * https://raw.githubusercontent.com/tdegrunt/jsonschema/master/lib/index.d.ts
 */
export interface JsonSchema {
    id?: string;
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
     * Synchronously resolves "$ref" includes in the JSON schema.
     *
     * @param {JsonSchema} jsonSchema  Schema with "$ref" includes.
     * @param {(name: string) => string} resolver  A callback function that takes the name
     *     of a JSON file and returns the contents of that file.
     * @returns {JsonSchema>  Schema with references resolved.
     */
    public static resolveReferences(
            jsonSchema: JsonSchema, fileResolver: (fileName: string) => string): JsonSchema {
        // TODO: Resolve JSON schema references.
        return jsonSchema;
    }

    /**
     * Asynchronously resolves "$ref" includes in the JSON schema.
     *
     * @param {JsonSchema} jsonSchema  Schema with "$ref" includes.
     * @param {(name: string) => Promise<string>} resolver  A callback function that takes
     *     the name of a JSON file and asynchronously returns the contents of that file.
     * @returns {Promise<JsonSchema>}  Schema with references resolved.
     */
    public static resolveReferencesAsync(
            jsonSchema: JsonSchema,
            fileResolver: (fileName: string) => Promise<string>): Promise<JsonSchema> {
        // TODO: Resolve JSON schema references.
        return Promise.resolve(jsonSchema);
    }
}
