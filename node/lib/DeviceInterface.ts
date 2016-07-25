
import { Schema } from "jsonschema";

/**
 * Base class for device interfaces, properties, methods, and parameters, which
 * all have a name and optional description.
 */
export abstract class DeviceCharacteristic {
    /**
     * Name of the characteristic. For interfaces this is a fully-qualified name.
     */
    public readonly name: string;

    /**
     * Optional English description of the interface, to be used as developer documentation.
     */
    public readonly description?: string;
}

/**
 * Specifies an interface that can be implemented by a device.
 *
 * Interfaces are composable, meaning they can reference other interfaces, which reference
 * other interfaces, etc. So getting a complete view of all of an interface's properties
 * and methods requires resolving and following all references. (Duplicate interface
 * references are ignored; cycles are not allowed.) Interface resolution is provided
 * by another class (TBD).
 *
 * Property and method names are allowed to conflict across different interfaces, even
 * ones that implemented by the same device. When accessing a device, an interface
 * context is always specifid.
 */
export class DeviceInterface extends DeviceCharacteristic {
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
    public readonly propertyType: Schema;
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
    public readonly parameterType: Schema;

    /**
     * True if this is an out parameter (return value), false if in.
     */
    public readonly isOut: boolean;
}
