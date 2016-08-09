
/**
 * Base class for device interfaces, properties, methods, and parameters, which
 * all have a name and optional description.
 */
export abstract class DeviceCharacteristic {
    /**
     * Name of the characteristic.
     *
     * The name property of an interface may be different from the interface's module name.
     * An interface name should be globally unique, to avoid potential conflicts with other
     * similar interfaces. Uniqueness is typically achieved using a reverse-domain-name style
     * hierarchical naming pattern.
     *
     * Property and method names are allowed to conflict across different interfaces, even
     * ones that implemented by the same translator. When invoking a translator, an interface
     * context is always specified.
     */
    public readonly name: string;

    /**
     * Optional English description of the interface, to be used as developer documentation.
     */
    public readonly description?: string;
}

/**
 * Describes an interface that can be implemented by a device translator.
 *
 * Interfaces are composable, meaning they can reference other interfaces, which reference
 * other interfaces, etc. So getting a complete view of all of an interface's properties
 * and methods requires resolving and following all references. (Duplicate interface
 * references are ignored; cycles are not allowed.) Interface resolution is provided
 * by the DeviceAccessor.getInterfaceAsync() method.
 */
export class DeviceInterface extends DeviceCharacteristic {
    /**
     * Merges multiple interfaces into a single combined interface containing
     * members from all specified interfaces and all interfaces they reference
     * recursively. Members having the same name are NOT combined unless, they
     * are also from the same interface.
     *
     * This may be used to generate a single interface that describes everything
     * a device is capable of. (The generated interface will always have an
     * empty list of references.)
     *
     * @param {DeviceInterface[]} interfaces  Array of interfaces to be merged
     * @param {string} name  Name of the new merged interface
     * @param {string} [description]  Optional description of the merged interface
     * @returns {DeviceInterface}  Merged interface
     */
    public static merge(
            interfaces: DeviceInterface[],
            name: string,
            description?: string): DeviceInterface {
        throw new Error("Not implemented");
    }

    /**
     * List of properties declared by this interface.
     */
    public readonly properties: DeviceProperty[];

    /**
     * List of methods declared by this interface.
     */
    public readonly methods: DeviceMethod[];

    /**
     * List of referenced interfaces declared by this interface. All properties and
     * methods from directly and indirectly referenced interfaces are effectively
     * included in this interface. (It's conceptually similar to interface inheritance.)
     */
    public readonly references: DeviceInterface[];
}

/**
 * A property declared by a DeviceInterface. Properties can be readable,
 * writeable, and/or notifiable. (A property that is notify-only is equivalent
 * to an AllJoyn signal.)
 */
export class DeviceProperty extends DeviceCharacteristic {
    /**
     * Name of the interface that declared this property.
     *
     * This may be useful when the property is included in a group along with properties from
     * referenced interfaces. The name of the interface that actually declared the property
     * (not just one that referenced it) must be used when accessing the property.
     */
    public readonly interfaceName: string;

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
 * A method declared by a device interface.
 */
export class DeviceMethod extends DeviceCharacteristic {
    /**
     * Name of the interface that declared this method.
     *
     * This may be useful when the method is included in a group along with methods from
     * referenced interfaces. The name of the interface that actually declared the method
     * (not just one that referenced it) must be used when invoking the method.
     */
    public readonly interfaceName: string;

    /**
     * List of method in and out parameters.
     *
     * Currently no more than one out parameter is allowed; the single
     * out parameter, if present, is the return value of a JavaScript method.
     */
    public readonly parameters: DeviceParameter[];
}

/**
 * A parameter of a method in a device interface.
 */
export class DeviceParameter extends DeviceCharacteristic {
    /**
     * JSON schema that specifies the type of the parameter.
     */
    public readonly parameterType: JsonSchema;

    /**
     * True if this is an out parameter (return value), false if in.
     */
    public readonly isOut: boolean;
}

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
