
import { JsonSchema } from "./JsonSchema";

/**
 * Base class for thing schemas, properties, methods, and parameters, which
 * all have a name and optional description.
 */
export abstract class ThingCharacteristic {
    /**
     * Name of the characteristic.
     *
     * The name property of a schema may be different from the schema's module name.
     * A schema name should be globally unique, to avoid potential conflicts with other
     * similar schemas. Uniqueness is typically achieved using a reverse-domain-name style
     * hierarchical naming pattern.
     *
     * Property and method names are allowed to conflict across different schemas, even
     * ones that implemented by the same translator. When invoking a translator, a schema
     * context is always specified.
     */
    public readonly name: string;

    /**
     * Optional English description of the schema, to be used as developer documentation.
     */
    public readonly description?: string;
}

/**
 * Describes a schema that can be implemented by a thing translator.
 *
 * Schemas are composable, meaning they can reference other schemas, which reference
 * other schemas, etc. So getting a complete view of all of a schema's properties
 * and methods requires resolving and following all references. (Duplicate schema
 * references are ignored; cycles are not allowed.) Schema resolution is provided
 * by the ThingAccessor.getSchemaAsync() method.
 */
export class ThingSchema extends ThingCharacteristic {
    /**
     * Merges multiple schemas into a single combined schema containing
     * members from all specified schemas and all schemas they reference
     * recursively. Members having the same name are NOT combined, unless they
     * are also from the same schema.
     *
     * This may be used to generate a single schema that describes everything
     * a thing is capable of. (The generated schema will always have an
     * empty list of references.)
     *
     * @param {ThingSchema[]} schemas  Array of schemas to be merged
     * @param {string} name  Name of the new merged schema
     * @param {string} [description]  Optional description of the merged schema
     * @returns {ThingSchema}  Merged schema
     */
    public static merge(
            schemas: ThingSchema[],
            name: string,
            description?: string): ThingSchema {
        throw new Error("Not implemented");
    }

    /**
     * List of properties declared by this schema.
     */
    public readonly properties: ThingProperty[];

    /**
     * List of methods declared by this schema.
     */
    public readonly methods: ThingMethod[];

    /**
     * List of referenced schemas declared by this schema. All properties and
     * methods from directly and indirectly referenced schemas are effectively
     * included in this schema. (It's conceptually similar to schema inheritance.)
     */
    public readonly references: ThingSchema[];
}

/**
 * A property declared by a ThingSchema. Properties can be readable,
 * writeable, and/or notifiable. (A property that is notify-only is equivalent
 * to an AllJoyn signal.)
 */
export class ThingProperty extends ThingCharacteristic {
    /**
     * Name of the schema that declared this property.
     *
     * This may be useful when the property is included in a group along with properties from
     * referenced schemas. The name of the schema that actually declared the property
     * (not just one that referenced it) must be used when accessing the property.
     */
    public readonly schemaName: string;

    /**
     * Whether the property is readable.
     */
    public readonly canRead: boolean;

    /**
     * Whether the property is writeable.
     */
    public readonly canWrite: boolean;

    /**
     * Whether the property supports notifications.
     *
     * Notifications can be subscribed to using the standard node events API.
     *
     * For a property that is also readable, a notification typically represents
     * a property-changed event. For a notify-only property, the meaning of the
     * notification may be different. Either way, the type of the notification
     * event object conforms to the property type schema.
     */
    public readonly canNotify: boolean;

    /**
     * JSON schema that specifies the type of the property.
     */
    public readonly propertyType: JsonSchema;
}

/**
 * A method declared by a thing schema.
 */
export class ThingMethod extends ThingCharacteristic {
    /**
     * Name of the schema that declared this method.
     *
     * This may be useful when the method is included in a group along with methods from
     * referenced schemas. The name of the schema that actually declared the method
     * (not just one that referenced it) must be used when invoking the method.
     */
    public readonly schemaName: string;

    /**
     * List of method in and out parameters.
     *
     * Currently no more than one out parameter is allowed; the single
     * out parameter, if present, is the return value of a JavaScript method.
     */
    public readonly parameters: ThingParameter[];
}

/**
 * A parameter of a method in a thing schema.
 */
export class ThingParameter extends ThingCharacteristic {
    /**
     * JSON schema that specifies the type of the parameter.
     */
    public readonly parameterType: JsonSchema;

    /**
     * True if this is an out parameter (return value), false if in.
     */
    public readonly isOut: boolean;
}
