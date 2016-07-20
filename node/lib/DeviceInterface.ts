
import { Schema } from "jsonschema";

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

export class DeviceProperty extends DeviceCharacteristic {
    /**
     * Name of the interface that declared this property.
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
     * Whether the property supports change notifications.
     * Notifications can be subscribed to using the standard node events API.
     */
    public readonly canNotify: boolean;

    /**
     * JSON schema that specifies the type of the property.
     */
    public readonly propertyType: Schema;
}

export class DeviceMethod extends DeviceCharacteristic {
    /**
     * Name of the interface that declared this method.
     */
    public readonly interfaceName: string;

    /**
     * List of method in and out parameters.
     */
    public readonly parameters: DeviceParameter[];
}

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
