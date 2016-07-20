// Source: https://raw.githubusercontent.com/tdegrunt/jsonschema/master/lib/index.d.ts
declare module 'jsonschema' {

export = jsonschema;

namespace jsonschema {

class Validator {
    constructor();
    customFormats: CustomFormat[];
    schemas: {[id:string]: Schema};
    unresolvedRefs: string[];

    attributes: {[property:string]: CustomProperty};

    addSchema(schema?: Schema, uri?: string): Schema|void;
    validate(instance: any, schema: Schema, options?: Options, ctx?: SchemaContext): ValidatorResult;
}

class ValidatorResult {
    constructor(instance: any, schema: Schema, options: Options, ctx: SchemaContext)
    instance: any;
    schema: Schema;
    propertyPath: string;
    errors: ValidationError[];
    throwError: boolean;
    disableFormat: boolean;
    valid: boolean;
    addError(detail:string|ErrorDetail): ValidationError;
    toString(): string;
}

class ValidationError {
    constructor(message?: string, instance?: any, schema?: Schema, propertyPath?: any, name?: string, argument?: any);
    property: string;
    message: string;
    schema: string|Schema;
    instance: any;
    name: string;
    argument: any;
    toString(): string;
}

class SchemaError extends Error{
    constructor(msg: string, schema: Schema);
    schema: Schema;
    message: string;
}

function validate(instance: any, schema: any, options?: Options): ValidatorResult

interface Schema {
    id?: string
    $schema?: string
    title?: string
    description?: string
    multipleOf?: number
    maximum?: number
    exclusiveMaximum?: boolean
    minimum?: number
    exclusiveMinimum?: boolean
    maxLength?: number
    minLength?: number
    pattern?: string
    additionalItems?: boolean | Schema
    items?: Schema | Schema[]
    maxItems?: number
    minItems?: number
    uniqueItems?: boolean
    maxProperties?: number
    minProperties?: number
    required?: string[]
    additionalProperties?: boolean | Schema
    definitions?: {
        [name: string]: Schema
    }
    properties?: {
        [name: string]: Schema
    }
    patternProperties?: {
        [name: string]: Schema
    }
    dependencies?: {
        [name: string]: Schema | string[]
    }
    'enum'?: any[]
    type?: string | string[]
    allOf?: Schema[]
    anyOf?: Schema[]
    oneOf?: Schema[]
    not?: Schema
}

interface Options {
    skipAttributes?: string[];
    allowUnknownAttributes?: boolean;
    rewrite?: RewriteFunction;
    propertyName?: string;
    base?: string;
}

interface RewriteFunction {
    (instance: any, schema: Schema, options: Options, ctx: SchemaContext): any;
}

interface SchemaContext {
    schema: Schema;
    options: Options;
    propertyPath: string;
    base: string;
    schemas: {[base:string]: Schema};
}

interface CustomFormat {
    (input: any): boolean;
}

interface CustomProperty {
    (instance: any, schema: Schema, options: Options, ctx: SchemaContext): string|ValidatorResult;
}

interface ErrorDetail {
    message: string;
    name: string;
    argument: string;
}

}
}
